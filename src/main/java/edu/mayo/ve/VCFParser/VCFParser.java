/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.VCFParser;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mongodb.*;
import com.mongodb.util.JSON;

import java.io.File;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

import com.tinkerpop.pipes.Pipe;
import com.tinkerpop.pipes.transform.IdentityPipe;
import com.tinkerpop.pipes.util.Pipeline;

import edu.mayo.TypeAhead.TypeAheadCollection;
import edu.mayo.TypeAhead.TypeAheadInterface;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.parsers.ParserInterface;
import edu.mayo.pipes.MergePipe;
import edu.mayo.pipes.PrintPipe;
import edu.mayo.pipes.UNIX.CatPipe;
import edu.mayo.pipes.bioinformatics.VCF2VariantPipe;
import edu.mayo.pipes.history.HistoryInPipe;
import edu.mayo.index.Index;
import edu.mayo.senders.FileSender;
import edu.mayo.senders.Sender;
import edu.mayo.util.Tokens;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.util.SystemProperties;
import java.io.IOException;

//import edu.mayo.cli.CommandPlugin; TO DO! get this to work :(
import edu.mayo.pipes.ReplaceAllPipe;
import edu.mayo.util.MongoConnection;
import java.util.Date;


/**
 *
 * @author m102417
 */
public class VCFParser implements ParserInterface {


    private int cacheSize = 50000;
    private Mongo m = MongoConnection.getMongo();
    /** testingCollection contains all of the objects placed into the workspace from parsing the VCF */
    HashMap<Integer,String> testingCollection = new HashMap<Integer,String>();
    JsonObject json = null;
    private boolean saveSamples = false;
    /** @param context                 - the execution context (so we can kill the process if needed)  -- can be null */
    private Task context = null;
    /** @param typeAhead               - the implementation for where value sets will be stored for providing type-ahead functionality. */
    private TypeAheadInterface typeAhead = new TypeAheadCollection();
    /**  @param testing    -- populate in-memoryt testingCollection instead of Mongo.  */
    private boolean testing = false;
    /** @param reporting - if verbose output is desired (much slower and not for production use, use when debugging) */
    private boolean reporting = false;

    private Double initialLinePerformance = 0.0;
    private Double averageLinePerformance = 0.0;

    public static void usage(){
            System.out.println("This program will parse a VCF file, obtain the 'schema' for that VCF and populate a MongoDB database with the variants in the VCF.");
            System.out.println("");
            System.out.println("Make sure to check your sys.properties file fo the MongoDB IP/Port combination, otherwised this script may fail");
            System.out.println("usage: VCFParser <input.vcf> <workspace_id>");

    }

    public static void main(String[] args) throws IOException, ProcessTerminatedException {
        SystemProperties sysprops = new SystemProperties();
        String mongoPort = sysprops.get("mongo_port");
        VCFParser parser = new VCFParser();
        if( args.length != 2 ) {
            usage();
            System.exit(1);
        }

        String infile = args[0];
        String workspace = args[1];
//        String infile = "/data/VCFExamples/BATCH4.vcf";
//        String outfile = "/data/VCFExamples/BATCH4.json";
//        String workspace = "w7ee29742ff80d61953d5e6f84e1686957fbe36f7";

        System.out.println("#Input File:  " + infile);
        System.out.println("#Workspace:  " + workspace);
        System.out.println("#mongo_server: " + sysprops.get("mongo_server") );
        System.out.println("#mongo port: " + new Integer(sysprops.get("mongo_port")));
        parser.setReporting(true);
        int datalines = parser.parse(null, infile, workspace, 50000, false, true, true);
        parser.checkAndUpdateLoadStatus(workspace, datalines, true);
        parser.m.close();
        //note the following will only work if you have a document in mongo like:
        //{ "_id" : { "$oid" : "51afa2710364d3ebd97b533a"} , "owner" : "steve" , "alias" : "foo" , "key" : "w7ee29742ff80d61953d5e6f84e1686957fbe36f7"}
        //parser.updateMetadata(workspace, "{ \"hosting\" : \"hostA\" , \"clients\" : \"888\" , \"type\" : \"vps\"}");
    }

    /**
     *
     * @return  The path to an error file that will show all errors with the load
     */
    public String getErrorFile(String workspace){
        try {
            SystemProperties sysprops = new SystemProperties();
            String tmp = sysprops.get("TEMPDIR");
            return tmp + File.separator + workspace + ".errors";
        }catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    /** legacy interface, keep it in place for testing */
    public int parse(Task context, String infile, String workspace, int typeAheadCacheSize) throws ProcessTerminatedException {
        return parse(context, infile, workspace, typeAheadCacheSize, false, false, true);
    }

    /** legacy interface, keep it in place for testing */
    public int parse(Task context, String infile, String workspace, int typeAheadCacheSize, boolean testing) throws ProcessTerminatedException{
        return parse(context, infile, workspace, typeAheadCacheSize, testing, false, true);
    }

    /** legacy interface, keep it in place for testing */
    public int parse(Task context, String infile, String workspace, int typeAheadCacheSize, boolean testing, boolean reporting, boolean saveSamples) throws ProcessTerminatedException {
        typeAhead = new TypeAheadCollection();
        this.saveSamples = saveSamples;
        this.reporting = reporting;
        this.testing = testing;
        return parse(infile, workspace);
    }

    /**
     * This is the simple direct interface that just works when we need a simple parser.
     * parse the infile, which is a raw vcf and put it into the mongo workspace
     * @param infile     - the raw complete (cononical) path to the file we want to parse as a string.
     * @param workspace  - the key for the workspace where we will put the data
     * @return lines processed.
     */
    public int parse(String infile, String workspace) throws ProcessTerminatedException{
        Sender sender = new FileSender(getErrorFile(workspace));
        if(reporting){ System.out.println("Getting the vcf-miner database from mongo"); }
        DB db = MongoConnection.getDB();
        if(reporting){ System.out.println("Getting the workspace collection from mongo"); }
        DBCollection col = db.getCollection(workspace);
        if(reporting){
            System.out.println("Setting up Pipeline,\n input file: " + infile);
            System.out.println("Workspace: " + workspace);
            System.out.println("TypeAhead: " + typeAhead);
            System.out.println("Testing: " + testing);
            System.out.println("Reporting: " + reporting);
        }
        //make sure we have type-ahead indexed before wo go-ahead and do the load:
        typeAhead.index(reporting);
        VCF2VariantPipe vcf = new VCF2VariantPipe(sender, true, false);
        Pipe p = new Pipeline(new CatPipe(),
                             new ReplaceAllPipe("\\{",""),
                             new ReplaceAllPipe("\\}",""),
                             new HistoryInPipe(),
                             vcf,
                             new MergePipe("\t"),
                             new ReplaceAllPipe("^.*\t\\{", "{"),
                             new ReplaceAllPipe("\"_id\":","\"_ident\":"),
                             new ReplaceAllPipe("Infinity","2147483648"),
                             //new PrintPipe(),
                             new IdentityPipe()
                );
        p.setStarts(Arrays.asList(infile));
        int i;
        long starttime = System.currentTimeMillis();
        DBObject jsonmeta = null;
        if(reporting) System.out.println("Processing Data....");
        for(i=0; p.hasNext(); i++){
            if(context!=null){ if(context.isTerminated()) throw new ProcessTerminatedException(); }
            if(reporting) System.out.println(col.count());
            String s = (String) p.next();
            //System.out.println(s);
            BasicDBObject bo = (BasicDBObject) JSON.parse(s);

            if(saveSamples == false){
                bo = removeSamples(bo);
            }

            //for type-ahead, we need access to the metadata inside the loop, try to force that here
            if(jsonmeta == null){
                //System.out.println(vcf.getJSONMetadata().toString());
                jsonmeta = (DBObject) JSON.parse(vcf.getJSONMetadata().toString());
            }

            if(reporting){
                System.out.println("row before removing dots:"); System.out.println(s);  }
            if(testing){
                testingCollection.put(new Integer(i), s);
            }else {//production
                //System.out.println(bo.toString());
                col.save(removeDots(bo, reporting));
                addToTypeAhead(bo, workspace,jsonmeta);
            }
            if(reporting){
                System.out.println("i:" + i + "\ts:" + s.length());
            }

            long curtime = System.currentTimeMillis();
            averageLinePerformance = 1.0*(curtime-starttime)/(i+1);
            if(i<50){
                //consider burn in, this is the initial reading(s)...
                initialLinePerformance = averageLinePerformance;
            }

        }

        json = vcf.getJSONMetadata();

        //do some small fixes to the metadata before continuing...
        //if(reporting){System.out.println("Updating metadata with type-ahead informaton");}
        //DEPRICATED!!!
        //json = updateMetadataWTypeAhead(json, typeAhead.getOverunFields());
        if(reporting){System.out.println("Changing the structure of the FORMAT metadata");}
        metadata = this.fixFormat((DBObject)JSON.parse(json.toString()));

        if(!testing){
            if(reporting){System.out.println("Updating metadata in database...");}
            updateMetadata(workspace, metadata.toString(), reporting);
            if(reporting){System.out.println("indexing...");}
            index(workspace, vcf, reporting);
            if(reporting){System.out.println("saving type-ahead results to the database");}
            typeAhead.index(reporting);
        }
        if(reporting){ System.out.println("done!");}
        return i; //the number of records processed
    }

    /**
     * checks to see if the key is
     * @param key
     * @param metadata
     */
    private boolean checkMetadataIsNumber(String key, DBObject metadata) {
        Object o = metadata.get("HEADER.INFO." + key + ".type");
        if(o == null){
            return false;
        }if (o instanceof String) {
            String s = (String) o;
            if(s.contains("float") || s.contains("Float") || s.contains("FLOAT") ||
                    s.contains("Double") || s.contains("double") || s.contains("DOUBLE") ||
                    s.contains("number") || s.contains("number") || s.contains("NUMBER")){
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param vcfLine
     * @param workspace
     * @param metadata  - what the header says about the field (e.g. is it a number, if so, then don't do a type-ahead!)
     */
    private void addToTypeAhead(DBObject vcfLine, String workspace, DBObject metadata){
        DBObject info = (DBObject) vcfLine.get("INFO"); //only care about info field for type-ahead
        if(info != null){
            for(String key : info.keySet()) {
                String ikey = "INFO." + key;
                if(!checkMetadataIsNumber(key,metadata)) { //check to see if the metadata indicates it is a number.
                    Object o = info.get(key);
                    if (o instanceof String) {
                        typeAhead.put(workspace, ikey, o.toString());
                    } else if (o instanceof Integer) {
                        typeAhead.put(workspace, ikey, String.valueOf((Integer) o));
                    } else if (o instanceof Double) {
                        typeAhead.put(workspace, ikey, String.valueOf((Double) o));
                    } else if (o instanceof BasicDBList) { //it is a list of values
                        addArrToTypeAhead((BasicDBList) o, workspace, ikey);
                    }//else we can't really type-ahead something else can we?
                }
            }
        }
    }

    /**
     *
     * @param values - a list of strings, doubles or ints.
     * @param workspace - string, workspace we
     */
    private void addArrToTypeAhead(BasicDBList values, String workspace, String ikey){
        //System.out.println("Adding Array: " + ikey);
        for(Object o : values){
            if (o instanceof String) {
                typeAhead.put(workspace, ikey, o.toString());
                //System.out.println(ikey + ((String) o));
            } else if (o instanceof Integer) {
                typeAhead.put(workspace, ikey, String.valueOf((Integer) o));
            } else if (o instanceof Double) {
                typeAhead.put(workspace, ikey, String.valueOf((Double) o));
            }
        }

    }

    private DBObject metadata = null;
    /**
     * for testing...
     */
    public DBObject getMetadata(){
        return metadata;
    }

    public BasicDBObject removeSamples(BasicDBObject o){
        o.removeField("samples");
        return o;
    }

    public int parse(Task task, String inputVCFFile, String workspace, TypeAheadInterface typeAhead, boolean testing) throws ProcessTerminatedException {
        if(task != null)
            context = task;
        if(typeAhead != null){
            this.typeAhead = typeAhead;
        }
        this.testing = testing;
        this.reporting = reporting;
        return parse(inputVCFFile, workspace);
    }

    /**
     * This needs to be called after a parse to ensure that the load gets correctly registered by the UI
     * checks to see if the load worked or if it failed
     * @param workspace - the key for the workspace
     * @param datalines - the number of lines of data in the load file
     * @param force - force the status as successful
     * @return true if it worked, false if it failed.
     */
    public boolean checkAndUpdateLoadStatus(String workspace, int datalines, boolean force){
        MetaData metaData = new MetaData();
        if(force){
            if(reporting) System.out.println("Force flag set, the workspace will be flagged as ready!");
            metaData.flagAsReady(workspace);
        }
        if(reporting) System.out.println("Checking the status of the load");

        //the first way the load could have failed is if the number of records in the workspace != the number of data lines

        BasicDBObject query = new BasicDBObject(); //empty for all
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        long linesLoaded = col.count(query);
        if(linesLoaded != datalines){
            metaData.flagAsFailed(workspace, "The load failed, the number of records in the workspace (" + linesLoaded + ") does not equal the number of data lines in the original file (" + datalines +")" );
            return false;
        }

        //are there other ways we could check / need to check that a load failed?

        //everything looks ok,
        //now flag the workspace as ready so the UI knows
        if(reporting) System.out.println("Flagging the workspace as ready");

        //requested change by patrick
        //metaData.flagAsReady(workspace);
        return true;
    }

    private class TrackNode {
        public TrackNode(DBObject node, boolean discovered){
            this.node = node;
            this.discovered = discovered;
        }
        public DBObject node;      // the position in the JSON structure where the dfs is pointing
        public DBObject shaddow;   // shaddow is the new node in the copy structure
        public boolean discovered = false;
    }

    /**
     * removeDots uses Depth First Search to traverse the json object hiarchy and replace any keys with a dot (.) in them
     * with keys that have an underscore (_).  This way mongo can load the key.
     * @param bo
     * @param reporting
     * @return
     */
    public DBObject removeDots(DBObject bo, boolean reporting){
        if(bo == null) return bo;
        if(bo.keySet().size() < 1) return bo;
        //Generic non-recursive DFS algorithm is:
        // 1  procedure DFS-iterative(G,v):
        // 2      let S be a stack
        // 3      S.push(v)
        // 4      while S is not empty
        // 5            v ← S.pop()
        // 6            if v is not labeled as discovered:
        // 7                label v as discovered
        // 8                for all edges from v to w in G.adjacentEdges(v) do
        // 9                    S.push(w)
        Stack<TrackNode> s = new Stack<TrackNode>();
        TrackNode v = new TrackNode(bo, false);
        s.push(v);
        while( s.size() > 0){
            v = s.pop();
            if(v.discovered == false){
                v.discovered = true;
                ArrayList<String> keyset = new ArrayList<String>();
                for(String key : v.node.keySet()){
                    //System.out.println(key);
                    keyset.add(key);
                    Object o = v.node.get(key);
                    if(o instanceof DBObject){
                        DBObject d = (DBObject) o;
                        s.push(new TrackNode(d,false));
                    }//else it is data
                }
                for(String key : keyset){
                    if(key.contains(".")){
                        Object o = v.node.get(key);
                        v.node = fixDBObjectDotKey(key, v.node);
                    }
                }
            }
        }
        if(reporting){
            System.out.println("removedDotsResult");
            System.out.println(bo.toString());
            System.out.println("end");
        }
        return bo;
    }

    public String getNth(String prefix, Set<String> keys, int index){
        int count =0;
        for(String key : keys){
            if(index == count) return key;
            count++;
        }
        return null;
    }

    public DBObject removeDots2(DBObject bo, boolean reporting){
        if(reporting) System.out.println("removeDots");
        //first, check to see if the top level directory has any dots
        for(String key : bo.keySet()){
            //first, check all the leafs (one dir down only)!
            Object o = bo.get(key);
            if(o instanceof BasicDBObject){
                BasicDBObject dboo = (BasicDBObject) o;
                //deal with this concurent modification problem...
                List<String> keys = new ArrayList();
                for(String zkey : dboo.keySet()){
                    keys.add(zkey);
                }
                for(String k2 : keys){
                    if(k2.contains(".")){
                        fixDBObjectDotKey(k2,dboo);
                    }
                }
            }
        }
        //now fix and check the branches (can't do in the same loop because of this concurency bug
        for(String key : bo.keySet()){
            //then check the branch
            if(key.contains(".")){
                fixDBObjectDotKey(key, bo);
            }
        }
        if(null != bo.get(".")){
            bo.removeField(".");
        }
        if(null != bo.get("INFO")){
            Object o = bo.get("INFO");
            if(o instanceof DBObject){
                if(  ((DBObject)o).get(".") != null  ){
                    ((DBObject)o).removeField(".");
                    if(  ((DBObject)o).keySet().size() == 0   ){
                        bo.put("INFO", ".");
                    }
                }
            }

        }
        if(reporting){
            System.out.println("removedDotsResult");
            System.out.println(bo.toString());
            System.out.println("end");
        }
        return bo;
    }

    public DBObject fixDBObjectDotKey(String key, DBObject dbo){
        String newkey = key.replaceAll("\\.", "_");
        Object o = dbo.get(key);
        if(o instanceof String){
            String value = (String) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof BasicDBObject){
            BasicDBObject value = (BasicDBObject) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof Integer){
            Integer value = (Integer) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof Double){
            Double value = (Double) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof Boolean){
            Boolean value = (Boolean) o;
            dbo.removeField(key);
            dbo.put(newkey,value);
            return dbo;
        }
        if(o instanceof BasicDBList){
            BasicDBList value = (BasicDBList) o;
            dbo.removeField(key);
            dbo.put(newkey,value);
            return dbo;
        }
        return dbo;
    }


    public void index(String workspace, VCF2VariantPipe vcf, boolean reporting){
        JsonObject json = vcf.getJSONMetadata();
        if(json == null){
            return;
        }
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);

        //auto-index all reserved columns (as needed by the app)
        indexReserved(col, reporting);
        //auto-index all SNPEFF columns
        indexSNPEFF(col, json, reporting);
        //index format
        indexFormat(vcf.getFormatKeys().keySet(), col, reporting);
    }

    /**
     * index the reserved fields that we already know about...
     * @param col
     * @param reporting
     */
    private void indexReserved(DBCollection col, boolean reporting){
        indexField("FORMAT.GenotypePostitiveCount", col, reporting);
        indexField("FORMAT.GenotypePositiveList",col, reporting); //don't need to index this as soon as the query is refactored
        indexField("FORMAT.HeterozygousList",col, reporting);
        indexField("FORMAT.HomozygousList",col, reporting);

    }


    private void indexSNPEFF(DBCollection col, JsonObject json, boolean reporting){
        //indexField("INFO.SNPEFF_GENE_NAME", col);
        for(String key: getSNPEFFColsFromJsonObj(json)){
            indexField("INFO." + key, col, reporting);
        }
    }

    /**
     *
     * @param json - the json metadata object
     * @return
     */
    public List<String> getSNPEFFColsFromJsonObj(JsonObject json){
        ArrayList<String> a = new ArrayList<String>();
        JsonObject header = json.getAsJsonObject("HEADER");
        if(header == null) return a;
        JsonObject info = header.getAsJsonObject("INFO");
        if(info == null) return a;
        Iterator<Map.Entry<String,JsonElement>> itter =info.entrySet().iterator();
        while(itter.hasNext()){
            Map.Entry<String, JsonElement> next = itter.next();
            String key = next.getKey();
            //System.out.println(key); //all keys in info
            if(key.contains("SNPEFF")){
                a.add(key);
            }
        }
        return a;
    }

    /**
     *
     * @param formatFields      - a list of fields to index (all format fields)
     * @param col       - the collection/workspace
     * @param reporting - if we want to show what is going on in the tomcat log
     */
    private void indexFormat(Set<String> formatFields, DBCollection col, boolean reporting){
        for(String field : formatFields){
            // FORMAT + . + . + field
            String ikey = "FORMAT." + "min." + field;
            String xkey = "FORMAT." + "max." + field;
            if(reporting){  System.out.println( "Trying to index: " + ikey);  }
            indexField(ikey, col, reporting);
            if(reporting){  System.out.println( "Trying to index: " + xkey);  }
            indexField(xkey, col, reporting);
        }
    }

    private void indexFieldReplacingDot(String field, DBCollection col, boolean reporting){ //don't think this is ever used...
        if(field.contains(".")){
            field = field.replace(".","_");
        }
        indexField(field, col, reporting);
    }

    private Index indexUtil = new Index(); //use the indexUtil instead of the raw interface to prevent duplicate indexes!
    private void indexField(String field, DBCollection col, boolean reporting){
        if(reporting) System.out.println("index: " + field);
        DBObject status = indexUtil.indexField(field,col);
        if(reporting) System.out.println(status.toString());
    }


    public void updateMetadata(String workspace, String jsonUpdate, boolean reporting){
        if(reporting) System.out.println("Saving Metadata to Workspace: " + workspace);
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);
        String query = "{\"key\":\""+workspace+"\"}";
        BasicDBObject bo = (BasicDBObject) JSON.parse(query); //JSON2BasicDBObject
        DBCursor dbc = col.find(bo);
        DBObject result = null;
        while(dbc.hasNext()){
            result = dbc.next();
            break;   //there will only be one that matches!
        }

        String owner = result.get(Tokens.OWNER).toString();
        String id = result.get("_id").toString();
        String alias = result.get(Tokens.WORKSPACE_ALIAS).toString();
        //key = workspace, passed in so we have that!
        col.remove(bo);
        //System.out.println("result: " + result.toString());

        //note, we want to destroy whatever was in there with the new data (in case they try to load multiple times)
        //but we have to keep owner, id, and key.
        BasicDBObject replace = (BasicDBObject) JSON.parse(jsonUpdate);
        //we need to remove any dot keys before we save the metadata to mongo.
        DBObject replaceWODots = removeDots(replace, reporting);
        //now add the new keys
        replaceWODots.put(Tokens.OWNER, owner);
        replaceWODots.put("key", workspace);
        replaceWODots.put("_id", id);
        replaceWODots.put("timestamp", getISONow()); //The last time the workspace was touched.
        replaceWODots.put(Tokens.WORKSPACE_ALIAS, alias);
        if(reporting) System.out.println(replaceWODots.toString());
        col.save(replaceWODots);
    }


    /**
     * In the metadata returned, the format field from the vcf-variant pipe looks something like this:
     *
     * "FORMAT": {
     * "PL": 1,
     * "AD": 1,
     * "GT": 1,
     * "GQ": 1,
     * "DP": 1,
     * "MLPSAF": 1,
     * "MLPSAC": 1
     * }
     *
     * This method transforms it into this (which is what mongodb will store):
     * "FORMAT": {
     *      "min": {
     *          "PL": 1,
     *          "AD": 1,
     *          "GT": 1,
     *          "GQ": 1,
     *          "DP": 1,
     *          "MLPSAF": 1,
     *          "MLPSAC": 1
     *      }
     *      "max": {
     *          "PL": 1,
     *          "AD": 1,
     *          "GT": 1,
     *          "GQ": 1,
     *          "DP": 1,
     *          "MLPSAF": 1,
     *          "MLPSAC": 1
     *      }
     * }
     *
     * @param input
     * @return
     */
    public DBObject fixFormat(DBObject input){
        DBObject output = input;
        DBObject oldformat = (DBObject) input.removeField("FORMAT");
        if(oldformat != null){
            DBObject min = new BasicDBObject();
            DBObject max = new BasicDBObject();
            for(String s : oldformat.keySet()){
                min.put(s,1);
                max.put(s,1);
            }
            DBObject format = new BasicDBObject();
            if(min.keySet().size() > 0 && max.keySet().size()>0){
                format.put("min", min);
                format.put("max", max);
            }
            output.put("FORMAT", format);
        }
        return output;
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


    public HashMap<Integer, String> getTestingCollection() {
        return testingCollection;
    }

    public void setTestingCollection(HashMap<Integer, String> testingCollection) {
        this.testingCollection = testingCollection;
    }

    public JsonObject getJson() {
        return json;
    }

    public void setJson(JsonObject json) {
        this.json = json;
    }

    public Mongo getM() {
        return m;
    }

    public void setM(Mongo m) {
        this.m = m;
    }

    public boolean isSaveSamples() {
        return saveSamples;
    }

    public void setSaveSamples(boolean saveSamples) {
        this.saveSamples = saveSamples;
    }

    public int getCacheSize() {
        return cacheSize;
    }

    public void setCacheSize(int cacheSize) {
        this.cacheSize = cacheSize;
    }

    public Task getContext() {
        return context;
    }

    public void setContext(Task context) {
        this.context = context;
    }

    public boolean isTesting() {
        return testing;
    }

    public void setTesting(boolean testing) {
        this.testing = testing;
    }

    @Override
    public void setTypeAhead(TypeAheadInterface typeAheadInterface) {
        this.typeAhead = typeAheadInterface;//To change body of implemented methods use File | Settings | File Templates.
    }

    public TypeAheadInterface getTypeAhead(){
        return typeAhead;
    }

    public boolean isReporting() {
        return reporting;
    }

    public void setReporting(boolean reporting) {
        this.reporting = reporting;
    }

    public void setMetadata(DBObject metadata) {
        this.metadata = metadata;
    }

    public Index getIndexUtil() {
        return indexUtil;
    }

    public void setIndexUtil(Index indexUtil) {
        this.indexUtil = indexUtil;
    }

    public Double getInitialLinePerformance() {
        return initialLinePerformance;
    }

    public void setInitialLinePerformance(Double initialLinePerformance) {
        this.initialLinePerformance = initialLinePerformance;
    }

    public Double getAverageLinePerformance() {
        return averageLinePerformance;
    }

    public void setAverageLinePerformance(Double averageLinePerformance) {
        this.averageLinePerformance = averageLinePerformance;
    }
}


