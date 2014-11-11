package edu.mayo.ve.FunctionalTests;

import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.VCFLoaderPool;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SubsetInfo;
import edu.mayo.ve.resources.Subset;
import edu.mayo.ve.resources.WorkerPoolManager;
import edu.mayo.ve.util.Tokens;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.File;
import java.util.Arrays;
import java.util.Random;

import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;

public class SubsetITCase {

    private final static long   RANDOM_LONG         = (new Random(System.currentTimeMillis()).nextLong());
    private final static String DUMMY_USER_ID       = "user_id_" + RANDOM_LONG;
    private final static String DUMMY_USER_TOKEN    = "user_token_" + RANDOM_LONG;
    private final static String DUMMY_ALIAS         = "alias_" + RANDOM_LONG;

    private SecurityUserAppHelper mockHelper;

    private static WorkerPool wp;

    @BeforeClass
    public static void setupLoaderPool() {
        LoadWorker logic = new LoadWorker(new VCFParser(), 50000);
        wp = new WorkerPool(logic, 1);
        VCFLoaderPool.setWp(wp);
        WorkerPoolManager.registerWorkerPool(Tokens.VCF_WORKERS, wp);
    }

    @AfterClass
    public static void tearDownLoaderPool() throws InterruptedException {
        wp.shutdown(1);
    }

    @Before
    public void setupMocks() throws Exception {
        mockHelper = mock(SecurityUserAppHelper.class);

        // mockito's way of mocking a method (e.g. registerWorkspace()) that returns void
        doNothing().when(mockHelper).registerWorkspace(eq(DUMMY_USER_ID), eq(DUMMY_USER_TOKEN), anyString(), eq(DUMMY_ALIAS));
    }


    @Test
    public void subset() throws Exception {

        Subset subset = new Subset(mockHelper);

        // Load a VCF into mongo database
//        String workspaceKey = loadVCF(new File("src/test/resources/testData/VCFUploadResourceITCase.vcf"));
        String workspaceKey = loadVCF(new File("src/test/resources/testData/Case.control.snpeff.hgvs.annovar.part.vcf"));

        // TODO: fix me
        Querry q = new Querry();
        q.setWorkspace(workspaceKey);
        SubsetInfo subsetInfo = new SubsetInfo();
        subsetInfo.setQuerry(q);
        subsetInfo.setSamples(Arrays.asList("s_Mayo_TN_CC_01", "s_Mayo_TN_CC_02", "s_Mayo_TN_CC_03"));

        subset.subset(subsetInfo, workspaceKey, DUMMY_USER_ID, DUMMY_ALIAS, DUMMY_USER_TOKEN);
    }

    /**
     * Helper method to load the specified VCF file into the Mongo database.
     *
     * @param vcf
     *      The VCF file to be loaded.
     * @return
     *      The workspace key of the loaded VCF.
     * @throws Exception
     */
    private String loadVCF(File vcf) throws Exception {

        ProblemVCFITCase pvcf = new ProblemVCFITCase();
        return pvcf.load(vcf.getAbsolutePath(), false);

//        InputStream inStream = new FileInputStream(vcf);
//        String reporting = "FALSE";
//        String compression = vcf.getName();
//        VCFUploadResource uploadResource = new VCFUploadResource(mockHelper);
//
//        Response r = uploadResource.uploadFile(DUMMY_USER_ID, DUMMY_ALIAS, reporting, compression, DUMMY_USER_TOKEN, inStream);
//
//        //get the workspace id from the raw response and check there is one variant in there
//        String json = r.getEntity().toString().replaceAll("File uploaded and workspace constructed :","");
//        JsonElement jelement = new JsonParser().parse(json);
//        JsonObject jobject = jelement.getAsJsonObject();
//        String workspaceKey = jobject.getAsJsonPrimitive("key").getAsString();
//
//        return workspaceKey;
    }
}
