package edu.mayo.ve.FunctionalTests;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.*;
import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.VCFLoaderPool;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SubsetInfo;
import edu.mayo.ve.resources.Subset;
import edu.mayo.ve.resources.WorkerPoolManager;
import edu.mayo.ve.util.Tokens;
import org.junit.*;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import static junit.framework.Assert.assertEquals;
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
    private static DB db;

    private JsonParser jsonParser = new JsonParser();

    @BeforeClass
    public static void setupMongoDB() {
        db = MongoConnection.getDB();
    }

    // TODO: cleanup mongo database

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


    @Ignore("This functionality is not yet implemented, so test fails") @Test
    public void subset() throws Exception {

        Subset subset = new Subset(mockHelper);

        // Load a VCF into mongo database
        String workspaceKey = loadVCF(new File("src/test/resources/testData/vcf-format-4_3.vcf"));

        // Original VCF has 3 samples [NA00001, NA00002, NA00003]
        // Subset   VCF has 2 samples [NA00001, NA00003]
        Querry q = new Querry();
        q.setWorkspace(workspaceKey);
        SubsetInfo subsetInfo = new SubsetInfo();
        subsetInfo.setQuerry(q);
        subsetInfo.setSamples(Arrays.asList("NA00001", "NA00003"));

        subset.subset(subsetInfo, workspaceKey, DUMMY_USER_ID, DUMMY_ALIAS, DUMMY_USER_TOKEN);

        // expected values PER variant
        // note that the AF has been recalculated for 2 samples [NA00001, NA00003]
        String variant1 = "{\"CHROM\":\"20\",\"POS\":\"14370\",\"ID\":\"rs6054257\",\"REF\":\"G\",\"ALT\":\"A\",\"QUAL\":\"29\",\"FILTER\":\"PASS\",\"INFO\":{\"NS\":3,\"DP\":14,\"AF\":[0.5],\"DB\":true,\"H2\":true},\"_ident\":\"rs6054257\",\"_type\":\"variant\",\"_landmark\":\"20\",\"_refAllele\":\"G\",\"_altAlleles\":[\"A\"],\"_minBP\":14370,\"_maxBP\":14370,\"FORMAT\":{\"max\":{\"DP\":5.0,\"GQ\":48.0,\"HQ\":51.0},\"min\":{\"DP\":1.0,\"GQ\":43.0,\"HQ\":51.0},\"GenotypePostitiveCount\":1,\"GenotypePositiveList\":[\"NA00003\"],\"HeterozygousList\":[],\"HomozygousList\":[\"NA00003\"],\"WildtypeList\":[\"NA00001\"]},\"CUSTOM\":{\"max\":{\"AD\":4.9E-324},\"min\":{\"AD\":1.7976931348623157E308}}}";
        String variant2 = "{\"CHROM\":\"20\",\"POS\":\"17330\",\"ID\":\".\",\"REF\":\"T\",\"ALT\":\"A\",\"QUAL\":\"3\",\"FILTER\":\"q10\",\"INFO\":{\"NS\":3,\"DP\":11,\"AF\":[0]},\"_ident\":\".\",\"_type\":\"variant\",\"_landmark\":\"20\",\"_refAllele\":\"T\",\"_altAlleles\":[\"A\"],\"_minBP\":17330,\"_maxBP\":17330,\"FORMAT\":{\"max\":{\"DP\":3.0,\"GQ\":49.0,\"HQ\":58.0},\"min\":{\"DP\":3.0,\"GQ\":49.0,\"HQ\":50.0},\"GenotypePostitiveCount\":0,\"GenotypePositiveList\":[],\"HeterozygousList\":[],\"HomozygousList\":[],\"WildtypeList\":[\"NA00001\",\"NA00003\"]},\"CUSTOM\":{\"max\":{\"AD\":4.9E-324},\"min\":{\"AD\":1.7976931348623157E308}}}";
        String variant3 = "{\"CHROM\":\"20\",\"POS\":\"1110696\",\"ID\":\"rs6040355\",\"REF\":\"A\",\"ALT\":\"G,T\",\"QUAL\":\"67\",\"FILTER\":\"PASS\",\"INFO\":{\"NS\":2,\"DP\":10,\"AF\":[0.25,0.75],\"AA\":\"T\",\"DB\":true},\"_ident\":\"rs6040355\",\"_type\":\"variant\",\"_landmark\":\"20\",\"_refAllele\":\"A\",\"_altAlleles\":[\"G\",\"T\"],\"_minBP\":1110696,\"_maxBP\":1110696,\"FORMAT\":{\"max\":{\"DP\":6.0,\"GQ\":21.0,\"HQ\":27.0},\"min\":{\"DP\":6.0,\"GQ\":21.0,\"HQ\":23.0},\"GenotypePostitiveCount\":2,\"GenotypePositiveList\":[\"NA00001\",\"NA00003\"],\"HeterozygousList\":[],\"HomozygousList\":[\"NA00001\",\"NA00003\"],\"WildtypeList\":[]},\"CUSTOM\":{\"max\":{\"AD\":4.9E-324},\"min\":{\"AD\":1.7976931348623157E308}}}";

        List<String> variantData = getWorkspaceData(workspaceKey);
        assertEquals("There should be 3 variants.", 3, variantData.size());
        assertEquals(variant1, variantData.get(0));
        assertEquals(variant2, variantData.get(1));
        assertEquals(variant3, variantData.get(2));
    }

    /**
     * Gets the data rows for the given workspace.
     *
     * @param workspaceKey
     *      The unique key for the workspace.
     * @return
     *      An {@link List} of strings, each string representing a data row
     *      from the original VCF file represented as a JSON document.
     */
    private List<String> getWorkspaceData(String workspaceKey) {
        DBCollection workspaceCollection = db.getCollection(workspaceKey);

        List<String> dataRows = new ArrayList<String>();

        // select all documents in collection
        DBCursor documents = workspaceCollection.find(new BasicDBObject());
        while(documents.hasNext()) {
            String json = documents.next().toString();

            JsonObject root = (JsonObject) jsonParser.parse(json);

            // remove the _id attribute because we're not interested in it for comparison
            root.remove("_id");

            dataRows.add(root.toString());
        }

        return dataRows;
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
