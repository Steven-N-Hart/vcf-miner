package edu.mayo.ve.FunctionalTests;

import com.mongodb.*;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.index.Index;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.Tokens;
import org.junit.Test;
import static org.junit.Assert.*;

import java.io.IOException;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 1/6/14
 * Time: 2:36 PM
 * To change this template use File | Settings | File Templates.
 */
public class IndexITCase {

    private Mongo m = MongoConnection.getMongo();
    private static TypeAheadITCase theadit = new TypeAheadITCase();
    private static String workspace = "wd5e9246fe1060d7fd0ca53628039ae006389a40a";

    //@BeforeClass
    public static void setup() throws IOException, ProcessTerminatedException {
        theadit.setUp();
        workspace = theadit.getWorkspaceID();
    }

    //@AfterClass
    public static void tearDown(){
        theadit.tearDown();
    }

    @Test
    public void testIndexProgress(){
        int queryCheck = 0;
        Index idxUte = new Index();
        System.out.println("TestIndexProgress");
        System.out.println("Note, if this test fails, try running again a few times, it should pass.  It can be a bit tricky to get the threads to sync up and mongo indexes fast, so you can't always observe the same thing... but you should see several inprog lists with stats and progress and everything needed to check on an indexing job!");
        //use another thread to check the progress of the index operation
        for(int i=0;i<500;i++){
            DBObject status = idxUte.getStatus4opsOnWorkspace(workspace);
            if(!status.toString().equals("{ \"current_operations\" : [ ]}")){
                System.out.println(status.toString());
                queryCheck++;
            }
            if(i==3){
                //create a new thread... and start indexing some field
                threadIndex("INFO.MLEAF");
                //index another couple fields
                threadIndex("INFO.MLEAC");
                threadIndex("INFO.FS");
            }
        }
        assertTrue(2 <= queryCheck); //assert that there where 3 queries that we could see, 1) an indexing op (could be more than 1), 2) a delete index op, and 3) a query to verify delete index

    }

    public void threadIndex(String field){
        Runnable task = new BackgroundIndexer(workspace,field);
        Thread worker = new Thread(task);
        // We can set the name of the thread
        worker.setName("indexing: " + field);
        // Start the thread, never call method run() direct
        worker.start();
    }


    public class BackgroundIndexer implements Runnable {
        private String field;
        private String workspace;
        public BackgroundIndexer(String workspaceID, String field) {
            this.workspace = workspaceID;
            this.field = field;
        }

        @Override
        public void run() {
            DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
            DBCollection col = db.getCollection(workspace);
            DBObject bo = new BasicDBObject();
            bo.put(field,1);
            System.out.println("creating index: " + field);
            col.createIndex(bo);
            System.out.println("dropping index: " + field);
            col.dropIndex(bo);
        }
    }
}
