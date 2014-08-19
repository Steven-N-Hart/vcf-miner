package edu.mayo.ve.FunctionalTests;

import com.google.common.util.concurrent.UncheckedExecutionException;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import edu.mayo.TypeAhead.TypeAheadInterface;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.parsers.ParserInterface;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.ve.resources.Provision;
import org.eclipse.jetty.util.ajax.JSON;
import org.junit.Test;

import java.util.HashMap;

import static com.mongodb.util.MyAsserts.assertTrue;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 3/19/14
 * Time: 11:50 AM
 * To change this template use File | Settings | File Templates.
 */
public class FailedLoadITCase {

    /**
     * This tests that if an exception is thrown during the processing of a file, the status of the workspace is changed to failed.
     * @throws ProcessTerminatedException
     */
    @Test
    public void testIOException() throws ProcessTerminatedException {
        String owner = "steve";
        String alias = "alias";
        String workspace = "w9c3fb5f300ab5073128749de49b1ff52d4819099";

        //provision the workspace
        Provision prov = new Provision();
        String json = prov.provision(owner, alias);

        //get out the id for the newly minted workspace...
        System.out.println(json);
        HashMap response = (HashMap) JSON.parse(json);
        workspace = (String) response.get(Tokens.KEY);

        MetaData meta = new MetaData();
        //make sure this workspace is flaged as ready...
        meta.flagAsReady(workspace);
        String readyStatus = meta.isReady(workspace);
        assertTrue(readyStatus.contains(" \"ready\" : 1"));

        //create a parser that fails all the time.
        ParserInterface parser = new FailParser();

        //inject the fail parser into a new LoadWorker
        LoadWorker worker = new LoadWorker(parser, 100000);
        worker.setDeleteAfterLoad(false); //don't delete the file we are 'loading' it will screw up other tests

        //create a pool with loader workers
        WorkerPool wp = new WorkerPool(worker, 1);

        //create a task for the workers to do...
        Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
        HashMap<String,String> hm = new HashMap<String,String>();
        hm.put(Tokens.VCF_LOAD_FILE,"src/test/resources/testData/example.vcf");
        hm.put(Tokens.KEY,workspace);
        hm.put(Tokens.OWNER,owner);
        t.setCommandContext(hm);

        try {
            //start processing... (this will fail)
            worker.compute(t);
            fail("Expected Runtime exception, we should never get here");
        }catch(Throwable e){
            System.out.println("Exception caught!");
            //goble up the exception... we want this to look smooth when we run the test suite.
        }

        //wp.addTask(t);
        //wp.startTask(t.getId());

//        t.setCommandContext(hm);
//        wp.addTask(t);           //this will add the UUID to the task
//        wp.startTask(t.getId());

        //verify that the failure status was updated...
        readyStatus = meta.isReady(workspace);
        //System.out.println(readyStatus);
        assertTrue(readyStatus.contains(" \"ready\" : 0"));

    }

    //Injectable 'parser' that throws a runtime exception.
    public class FailParser implements ParserInterface {

        private boolean loadStatus = true;
        @Override
        public int parse(String s, String s2) throws ProcessTerminatedException {
            throw new RuntimeException("FailParser: fail all over, this error is expected and for testing");
        }

        @Override
        public boolean checkAndUpdateLoadStatus(String s, int i, boolean b) {
            return loadStatus;
        }

        @Override
        public void setM(Mongo mongo) {
            //do nothing
        }

        @Override
        public void setReporting(boolean b) {
            //To change body of implemented methods use File | Settings | File Templates.
        }

        @Override
        public void setTesting(boolean b) {
            //To change body of implemented methods use File | Settings | File Templates.
        }

        @Override
        public void setTypeAhead(TypeAheadInterface typeAhead) {
            //To change body of implemented methods use File | Settings | File Templates.
        }


        public boolean isLoadStatus() {
            return loadStatus;
        }

        public void setLoadStatus(boolean loadStatus) {
            this.loadStatus = loadStatus;
        }
    }



    @Test
    public void testLoadNoSamples() throws InterruptedException {
        String owner = "steve";
        String alias = "alias";
        String workspace = "w9c3fb5f300ab5073128749de49b1ff52d4819099";

        //provision the workspace
        Provision prov = new Provision();
        String json = prov.provision(owner, alias);

        //get out the id for the newly minted workspace...
        System.out.println(json);
        HashMap response = (HashMap) JSON.parse(json);
        workspace = (String) response.get(Tokens.KEY);

        MetaData meta = new MetaData();
        //make sure this workspace is flaged as ready...
        meta.flagAsReady(workspace);
        String readyStatus = meta.isReady(workspace);
        assertTrue(readyStatus.contains(" \"ready\" : 1"));

        //create a vcfparser that will fail on this malformed input.
        VCFParser parser = new VCFParser();

        //inject the VCF parser into a new LoadWorker
        LoadWorker worker = new LoadWorker(parser, 100000);
        worker.setDeleteAfterLoad(false); //don't delete the file we are 'loading' it will screw up other tests
        worker.setLogStackTrace(false);   //don't show the stacktrace on this failure to the screen, we don't want it to confuse people

        //create a pool with loader workers
        WorkerPool wp = new WorkerPool(worker, 1);

        //create a task for the workers to do...
        Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
        HashMap hm = new HashMap();
        hm.put(Tokens.VCF_LOAD_FILE,"src/test/resources/testData/clinvar1500_20140430.vcf");
        hm.put(Tokens.KEY,workspace);
        hm.put(Tokens.OWNER,owner);
        hm.put(Tokens.DATA_LINE_COUNT, new Integer(1500));
        t.setCommandContext(hm);

        //start processing
        try {
            //the parser will throw an InvalidPipeInputException (Invalid VCF data) we want to ensure that this gets logged to MongoDB as a fail
            worker.compute(t);
        } catch (ProcessTerminatedException e) {
            fail();
            //should never get here, the worker will
            //e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }

        //verify that the failure status was updated...
        readyStatus = meta.isReady(workspace);
        System.out.println(readyStatus);
        assertTrue(readyStatus.contains(" \"ready\" : 0"));

        //
        wp.shutdown(1);

    }


    /**
     * This tests if we load some junk file into the system that it transitions to 'fail' rather than 'ready'
     */
    @Test
    public void testLoadJunk(){
        String owner = "steve";
        String alias = "alias";
        String workspace = "w9c3fb5f300ab5073128749de49b1ff52d4819099";

        //provision the workspace
        Provision prov = new Provision();
        String json = prov.provision(owner, alias);

        //get out the id for the newly minted workspace...
        System.out.println(json);
        HashMap response = (HashMap) JSON.parse(json);
        workspace = (String) response.get(Tokens.KEY);

        MetaData meta = new MetaData();
        //make sure this workspace is flaged as ready...
        meta.flagAsReady(workspace);
        String readyStatus = meta.isReady(workspace);
        assertTrue(readyStatus.contains(" \"ready\" : 1"));

        //create a vcfparser that will fail on this malformed input.
        VCFParser parser = new VCFParser();

        //inject the VCF parser into a new LoadWorker
        LoadWorker worker = new LoadWorker(parser, 100000);
        worker.setDeleteAfterLoad(false); //don't delete the file we are 'loading' it will screw up other tests
        worker.setLogStackTrace(false);   //don't show the stacktrace on this failure to the screen, we don't want it to confuse people

        //create a pool with loader workers
        WorkerPool wp = new WorkerPool(worker, 1);

        //create a task for the workers to do...
        Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
        HashMap<String,String> hm = new HashMap<String,String>();
        hm.put(Tokens.VCF_LOAD_FILE,"src/test/resources/testData/foo.tsv");
        hm.put(Tokens.KEY,workspace);
        hm.put(Tokens.OWNER,owner);
        t.setCommandContext(hm);

        //start processing
        try {
            //the parser will throw an InvalidPipeInputException (Invalid VCF data) we want to ensure that this gets logged to MongoDB as a fail
            worker.compute(t);
        } catch (ProcessTerminatedException e) {
            fail();
            //should never get here, the worker will
            //e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }

        //verify that the failure status was updated...
        readyStatus = meta.isReady(workspace);
        System.out.println(readyStatus);
        assertTrue(readyStatus.contains(" \"ready\" : 0"));

        //check that the workerpool


    }

}
