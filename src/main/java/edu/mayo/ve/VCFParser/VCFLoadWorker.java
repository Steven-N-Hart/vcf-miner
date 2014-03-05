package edu.mayo.ve.VCFParser;

import com.mongodb.*;
import edu.mayo.concurency.ProcessTerminatedException;
import edu.mayo.concurency.Task;
import edu.mayo.concurency.WorkerLogic;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.ve.util.MongoConnection;
import edu.mayo.ve.util.SystemProperties;
import edu.mayo.ve.util.Tokens;

import java.io.File;
import java.io.IOException;
import java.net.UnknownHostException;
import java.util.HashMap;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/19/13
 * Time: 10:25 PM
 * To change this template use File | Settings | File Templates.
 */
public class VCFLoadWorker  implements WorkerLogic {

       public static void main(String[] args)throws ProcessTerminatedException{
           VCFLoadWorker worker = new VCFLoadWorker(100000);
           Task t = new Task();
           HashMap<String,String> hm = new HashMap<String,String>();
           hm.put(Tokens.VCF_LOAD_FILE,"src/test/resources/testData/example.vcf");
           hm.put(Tokens.KEY,"w9c3fb5f300ab5073128749de49b1ff52d4819099");
           t.setCommandContext(hm);
           worker.compute(t);
       }

        private int theadCache;
        public VCFLoadWorker(int lookAheadCacheSize){
            this.theadCache = lookAheadCacheSize;
        }

        boolean report = false;
        public VCFLoadWorker(int lookAheadCacheSize, boolean reporting){
            this.theadCache = lookAheadCacheSize;
            this.report = reporting;
        }

        VCFParser parser = new VCFParser();
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
                parser.parse(t, loadfile,workspace,theadCache,false, report, loadSamples); //make the third to last one false in production!   make the second to last one false in production!
                if(report) System.out.println("File loading done");

                if(report) System.out.println("Checking to see if the file upload worked or failed.");
                HashMap<String,Integer> icontext = (HashMap) t.getCommandContext(); //need to cast this to an integer
                parser.checkAndUpdateLoadStatus(workspace, icontext.get(Tokens.DATA_LINE_COUNT), false, report);

                //calculate and log the processing time
                long endTime   = System.currentTimeMillis();
                long totalTime = endTime - startTime;
                //change to logger!
                System.out.println("__LOADTIME__ Loading to workspace: " + workspace + " LOADFILE: " + loadfile + " total time (millis): " + totalTime);

            }catch(Exception e){   //this thread is working in the background... so we need to make sure that it outputs an error if one came up
                e.printStackTrace();
                MetaData meta = new MetaData();
                meta.flagAsFailed(workspace,"The Load Failed with Exception: " + e.getMessage());
            }
            //delete the load file
            if(report) System.out.println("Now I am deleting the file");
            File file = new File(loadfile);
            file.delete();
            //t.setResultContext(new Long(sum)); //put the result in result context, if needed
            return t;
        }

        public boolean isTerminated(){
            return false;
        }

    public static boolean isLoadSamples() {
        return loadSamples;
    }

    public static void setLoadSamples(boolean loadSamples) {
        VCFLoadWorker.loadSamples = loadSamples;
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
//                DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
//                DBCollection col = db.getCollection("meta");
//                DBCursor dbc = col.find();
//                while(dbc.hasNext()){
//                    System.out.println(dbc.next());
//                }
            } catch (UnknownHostException e) {
                e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
            }

        }
    }