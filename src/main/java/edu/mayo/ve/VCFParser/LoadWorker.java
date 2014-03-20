package edu.mayo.ve.VCFParser;

import com.mongodb.*;
import edu.mayo.TypeAhead.TypeAhead;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerLogic;
import edu.mayo.parsers.ParserInterface;
import edu.mayo.util.Tokens;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.util.SystemProperties;

import java.io.File;
import java.io.IOException;
import java.net.UnknownHostException;
import java.util.HashMap;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/19/13
 * Time: 10:25 PM
 * LoadWorker loads files into the MongoDB database (e.g. VCFFiles)
 * The Parser passed to the constructor (e.g. VCFParser) determines the type of file that is loaded by the LoadWorker.
 */
public class LoadWorker implements WorkerLogic {

    ParserInterface parser = null;
    private boolean deleteAfterLoad = true;
    private boolean logStackTrace = true;

       public static void main(String[] args)throws ProcessTerminatedException {
           VCFParser parser = new VCFParser();
           LoadWorker worker = new LoadWorker(parser, 100000);
           Task t = new Task();
           HashMap<String,String> hm = new HashMap<String,String>();
           hm.put(Tokens.VCF_LOAD_FILE,"src/test/resources/testData/example.vcf");
           hm.put(Tokens.KEY,"w9c3fb5f300ab5073128749de49b1ff52d4819099");
           t.setCommandContext(hm);
           worker.compute(t);
       }

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
            HashMap<String,String> context = (HashMap) t.getCommandContext();
            String workspace = context.get(Tokens.KEY);
            String loadfile = context.get(Tokens.VCF_LOAD_FILE);
            try {
                long startTime = System.currentTimeMillis();

                if(report) System.out.println("Setting up the mongo connection");
                setMongo();
                if(report) System.out.println("I am working on loading this file: " + loadfile);
                TypeAhead thead = new TypeAhead("INFO", theadCache, report);
                parser.parse(t, loadfile,workspace,thead,false, report); //make the third to last one false in production!   make the second to last one false in production!
                if(report) System.out.println("File loading done");

                if(report) System.out.println("Checking to see if the file upload worked or failed.");
                HashMap<String,Integer> icontext = (HashMap) t.getCommandContext(); //need to cast this to an integer
                parser.checkAndUpdateLoadStatus(workspace, icontext.get(Tokens.DATA_LINE_COUNT), false, report);

                //calculate and log the processing time
                long endTime   = System.currentTimeMillis();
                long totalTime = endTime - startTime;
                //change to logger!
                System.out.println("__LOADTIME__ Loading to workspace: " + workspace + " LOADFILE: " + loadfile + " total time (millis): " + totalTime);

            }catch(Throwable e){   //this thread is working in the background... so we need to make sure that it outputs an error if one came up
                if(logStackTrace){ e.printStackTrace(); }
                MetaData meta = new MetaData();
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
        public void setMongo() {
            if(sysprop == null){
                try {
                    sysprop = new SystemProperties();
                    host = sysprop.get("mongo_server");
                    port = new Integer(sysprop.get("mongo_port"));
                    //just do this at this time because we can
                    loadSamples = new Boolean(sysprop.get("load_samples"));
                } catch (IOException e) {
                    e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
                }
            }
            //make a new MongoConnection for this worker -- let mongo take care of static references and singleton and so on
            try {
                Mongo m = new MongoClient(host , port);
                parser.setM(m);
//                DB db = MongoConnection.getDB();
//                DBCollection col = db.getCollection("meta");
//                DBCursor dbc = col.find();
//                while(dbc.hasNext()){
//                    System.out.println(dbc.next());
//                }
            } catch (UnknownHostException e) {
                e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
            }

        }


    public boolean isLogStackTrace() {
        return logStackTrace;
    }

    public void setLogStackTrace(boolean logStackTrace) {
        this.logStackTrace = logStackTrace;
    }
}