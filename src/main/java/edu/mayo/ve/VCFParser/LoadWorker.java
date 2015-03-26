package edu.mayo.ve.VCFParser;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerLogic;
import edu.mayo.index.Index;
import edu.mayo.parsers.ParserInterface;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.util.SystemProperties;
import edu.mayo.ve.util.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.TimeZone;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/19/13
 * Time: 10:25 PM
 * LoadWorker loads files into the MongoDB database (e.g. VCFFiles)
 * The Parser passed to the constructor (e.g. VCFParser) determines the type of file that is loaded by the LoadWorker.
 */
public class LoadWorker implements WorkerLogic {

    private static final Logger logger = LoggerFactory.getLogger(LoadWorker.class);

    ParserInterface parser = null;
    private boolean deleteAfterLoad = true;
    private boolean logStackTrace = true;

    /**
     * Key lengths greater than this threshold will be reduced down to a 32 character
     * length via MD5 checksum.
     */
    private static int mapReduceKeyLengthThreshold = 120; // default value (override in sys.properties)
    private final String MR_KEY_THRESH = "MAP_REDUCE_KEY_HASH_THRESHOLD";

    private int theadCache;
    public LoadWorker(ParserInterface parser, int lookAheadCacheSize){
        this.parser = parser;
        this.theadCache = lookAheadCacheSize;
    }

    boolean report = false;
    public LoadWorker(ParserInterface parser, int lookAheadCacheSize, boolean reporting){
        this.parser = parser;
        this.theadCache = lookAheadCacheSize;
        this.report = reporting;
    }

    public Task compute(Task t) throws ProcessTerminatedException {
        //System.out.println("Started up a worker");
        //In the case of a LoadWorker, the command context is a hashmap that we can get values on
        HashMap<String,String> context = (HashMap) t.getCommandContext();
        String workspace = context.get(Tokens.KEY);
        String loadfile = context.get(Tokens.VCF_LOAD_FILE);
        MetaData meta = new MetaData();
        try {
            long startTime = System.currentTimeMillis();

            if(report) System.out.println("Setting up the mongo connection");
            setMongo();
            if(report) System.out.println("I am working on loading this file: " + loadfile);

            if(report) System.out.println("Parsing the file...");
            parser.parse(loadfile,workspace); //make the third to last one false in production!   make the second to last one false in production!
            if(report) System.out.println("File loading done");

            if(report) System.out.println("Checking to see if the file upload worked or failed.");
            HashMap<String,Integer> icontext = (HashMap) t.getCommandContext(); //need to cast this to an integer

            if(report) System.out.println("Running map-reduce to produce TypeAhead collection...");
            createTypeAheadCollection(MongoConnection.getDB().getCollection(workspace));
            if(report) System.out.println("TypeAhead collection done.");

            //calculate and log the processing time
            long endTime   = System.currentTimeMillis();
            long totalTime = endTime - startTime;
            icontext.put("TimeElapsed", (int) totalTime);
            //change to logger!
            System.out.println("__LOADTIME__ Loading to workspace: " + workspace + " LOADFILE: " + loadfile + " total time (millis): " + totalTime);

            //update the system's metadata with loading statistics
            meta.updateLoadStatistics(workspace,icontext);
            setWorkspaceCompletionTimestamp(workspace);
            parser.checkAndUpdateLoadStatus(workspace, icontext.get(Tokens.DATA_LINE_COUNT), false);
            meta.flagAsReady(workspace);

        }catch(Throwable e){   //this thread is working in the background... so we need to make sure that it outputs an error if one came up
            // dump to server log via STDERR
            logger.error(e.getMessage(), e);

            // write stacktrace to the workspace errors log so the user can view it
            StringWriter stackTraceWriter = new StringWriter();
            e.printStackTrace(new PrintWriter(stackTraceWriter));
            String mesg = String.format(
                    "Internal System Error\n" +
                            "\n" +
                            "Validate your VCF file using vcf-validate (see http://vcftools.sourceforge.net).\n" +
                            "If your VCF file passes validation, please send the diagnostic information below to the development team:\n" +
                            "\n%s"
                    ,stackTraceWriter.toString());
            try {
                IOUtils.writeToErrorFile(workspace, mesg);
                meta.updateLoadStatistics(workspace, (HashMap) t.getCommandContext());
            } catch (IOException ioe) {
                ioe.printStackTrace();
            }

            meta.flagAsFailed(workspace,"The Load Failed with Exception: " + e.getMessage());
        }
        //delete the load file
        if(deleteAfterLoad){
            if(report) System.out.println("Now I am deleting the file");
            File file = new File(loadfile);
            file.delete();
            //t.setResultContext(new Long(sum)); //put the result in result context, if needed
        }
        return t;
    }

    public boolean isTerminated(){
        return false;
    }



    public static boolean isLoadSamples() {
        return loadSamples;
    }

    public static void setLoadSamples(boolean loadSamples) {
        LoadWorker.loadSamples = loadSamples;
    }

    public boolean isDeleteAfterLoad() {
        return deleteAfterLoad;
    }

    public void setDeleteAfterLoad(boolean deleteAfterLoad) {
        this.deleteAfterLoad = deleteAfterLoad;
    }

    private static String host = "localhost";
    private static int  port =  27017;
    private static SystemProperties sysprop = null;
    private static boolean loadSamples = false;
    public void setMongo() throws IOException {
        if(sysprop == null){
            if(report){System.out.println("Reading sys.properties to get the configuration");}
            sysprop = new SystemProperties();
            host = sysprop.get("mongo_server");
            port = new Integer(sysprop.get("mongo_port"));
            //just do this at this time because we can
            loadSamples = new Boolean(sysprop.get("load_samples"));

            if (sysprop.propertySet().contains(MR_KEY_THRESH)) {
                mapReduceKeyLengthThreshold = Integer.parseInt(sysprop.get(MR_KEY_THRESH));
            }
            System.out.println(String.format("Map Reduce Key Length Threshold=%s", mapReduceKeyLengthThreshold));
        }


        //make a new MongoConnection for this worker -- let mongo take care of static references and singleton and so on
        if(report){System.out.println("Setting the MongoDB connection on the parser");}
        //Mongo m = new MongoClient(host , port);
        Mongo m = MongoConnection.getMongo();
        parser.setM(m);
//                DB db = MongoConnection.getDB();
//                DBCollection col = db.getCollection("meta");
//                DBCursor dbc = col.find();
//                while(dbc.hasNext()){
//                    System.out.println(dbc.next());
//                }

    }


    public boolean isLogStackTrace() {
        return logStackTrace;
    }

    public void setLogStackTrace(boolean logStackTrace) {
        this.logStackTrace = logStackTrace;
    }

    public boolean isReport() {
        return report;
    }

    public void setReport(boolean report) {
        this.report = report;
    }

    /**
     * Creates a new Mongo collection for the typeahead data as a post-processing step.
     *
     * @param variantCollection The collection of variant data.
     */
    public static void createTypeAheadCollection(DBCollection variantCollection) throws Exception {

        // The MAP produces unique keys that will be counted in the REDUCE function.
        //
        // The format of the key is:
        //
        //      <INFO field name>|<INFO field value>
        //
        // Example:
        //
        //      SNPEFF_GENE_NAME|AGRN
        //
        // NOTE: if the key length is too long (see threshold class variable),
        // an MD5 checksum of length 32 is used instead to avoid hitting the
        // key length limitations of the database.
        //
        // The emit() passes a new "payload" object containing the following:
        // 1.) field: The field name
        // 2.) value: The field value
        // 3.) count: set to "1" to signify 1 instance was found of this key
        //
        String map =
                "function () {" +

                        "var emitHelper = function(key, value) {" +
                            String.format("if(key.length > %s) {", mapReduceKeyLengthThreshold) +
                                "emit(hex_md5(key), value);"+
                            "} else {" +
                                "emit(key, value);"+
                            "}" +
                        "};"+

                        "for (var name in this.INFO) {" +

                            "var value = this.INFO[name];" +

                            "var payload = new Object();" +
                            "payload.field = 'INFO.' + name;" +
                            "payload.count = 1;" +

                            "if ((typeof value == 'string') && (value != '.')) {" +
                                "payload.value = value;" +
                                "emitHelper(name + value, payload);" +
                            "}" +
                            "else if ((value instanceof Array) && (typeof value[0] == 'string')) {" +
                                "for(var i=0; i < value.length; i++) {" +
                                    "payload.value = value[i];" +
                                    "emitHelper(name + value[i], payload);" +
                                "}" +
                            "}" +
                        "}" +
                 "}";

        // The REDUCE simply sums the instances together into a single total (e.g. count).
        String reduce =
                "function (key, payloads) {" +
                        "if (payloads.length == 0) return null;"+

                        "var reducedPayload = new Object();" +
                        "reducedPayload.field = payloads[1].field;" +
                        "reducedPayload.value = payloads[1].value;" +
                        "reducedPayload.count = 0;" +

                        "for (var i = 0; i < payloads.length; i++) {" +
                            "reducedPayload.count += payloads[i].count" +
                        "}" +

                        "return reducedPayload;"+
                 "}";

        final String typeaheadCollectionName = variantCollection.getName()+".typeahead";

        MapReduceCommand cmd = new MapReduceCommand(variantCollection, map, reduce, typeaheadCollectionName, MapReduceCommand.OutputType.REPLACE, null);

        variantCollection.mapReduce(cmd);

        // transform the typeahead schema
        DBCollection typeaheadCol = MongoConnection.getDB().getCollection(typeaheadCollectionName);
        final DBObject grabEverythingQuery = new BasicDBObject();

        // STEP 1 - rename "value" to "temp"
        final DBObject renameToTemp = new BasicDBObject("$rename", new BasicDBObject("value", "temp"));
        typeaheadCol.update(grabEverythingQuery, renameToTemp, false, true);

        // STEP 2 - move "temp" attributes up a level
        final DBObject moveUp = new BasicDBObject("$rename", new BasicDBObject("temp.field", "field").append("temp.value", "value").append("temp.count", "count"));
        typeaheadCol.update(grabEverythingQuery, moveUp, false, true);

        // STEP 3 - delete "temp"
        final DBObject delete = new BasicDBObject("$unset", new BasicDBObject("temp", ""));
        typeaheadCol.update(grabEverythingQuery, delete, false, true);

        // index the field attribute
        Index indexUtil = new Index();
        indexUtil.indexField("field", typeaheadCol);
    }

    /**
     * Sets the timestamp for the workspace being completely loaded.
     *
     * @param workspaceID
     */
    public void setWorkspaceCompletionTimestamp(String workspaceID){
        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspaceID);
        BasicDBObject update = new BasicDBObject();
        update.append("$set", new BasicDBObject().append("timestamp", getISONow()));
        MongoConnection.getDB().getCollection(Tokens.METADATA_COLLECTION).update(query, update);
    }

    /**
     *
     * @return the current time in iso format
     */
    public String getISONow(){
        TimeZone tz = TimeZone.getTimeZone("UTC");
        DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mmZ");
        df.setTimeZone(tz);
        String nowAsISO = df.format(new Date());
        return nowAsISO;
    }
}