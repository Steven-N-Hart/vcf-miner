package edu.mayo.ve.resources;

import com.tinkerpop.pipes.util.Pipeline;
import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.pipes.UNIX.CatPipe;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFLoaderPool;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import org.junit.Test;

import java.io.*;
import java.util.Arrays;

import static com.mongodb.util.MyAsserts.assertEquals;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/19/13
 * Time: 10:40 AM
 * To change this template use File | Settings | File Templates.
 */
public class VCFUploadResourceTest {
    @Test
    public void testUploadFile() throws Exception {
        VCFUploadResource up = new VCFUploadResource();
        BufferedReader br = new BufferedReader(new FileReader("src/test/resources/testData/httpExample.vcf"));
        //up.writeFile(br,"/dev/null");    THIS TEST IS NO LONGER FUNCTIONAL!
    }

    /**
     * this tests that the raw upload function copies the data from a test file correctly
     * @throws Exception
     */
    @Test
    public void testUploadCompressedFile() throws Exception {
        VCFUploadResource up = new VCFUploadResource();
        String compressedFile = "src/test/resources/testData/Annotated.functional.vcf.gz";
        LoadWorker logic = new LoadWorker(new VCFParser(), 50000);//do we want to let them pass this value?
        WorkerPool wp = new WorkerPool(logic, 1);
        VCFLoaderPool.setWp(wp);
        WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
        InputStream is = new FileInputStream(compressedFile);
        //up.uploadFile("dan","alias","FALSE",".gz", is);  // this requires that you do the ETL, don't want to test that in a unit test
        String tmpout = "/tmp/uploadedAnnotated.functional.vcf.gz";
        up.writeFile(is,tmpout);
        int count = 0;
        Pipeline p = new Pipeline(new CatPipe());
        p.setStarts(Arrays.asList(tmpout));
        while(p.hasNext()){p.next(); count++;}
        assertEquals(1793, count);
        File f = new File(tmpout);
        f.delete();
    }

//    @Test
//    public void testUploadCompressedViaREST() {
//        //start up the server
//
//        //test the interface
//
//        //stop the server
//
//
//    }



}
