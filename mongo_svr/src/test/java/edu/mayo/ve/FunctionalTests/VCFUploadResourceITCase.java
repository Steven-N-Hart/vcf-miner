package edu.mayo.ve.FunctionalTests;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;

import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.LoaderPool;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.resources.ExeQuery;
import edu.mayo.ve.resources.VCFUploadResource;
import edu.mayo.ve.resources.WorkerPoolManager;
import edu.mayo.ve.util.Tokens;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import javax.ws.rs.core.Response;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Random;

import static junit.framework.Assert.assertEquals;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.*;

public class VCFUploadResourceITCase {

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
        LoaderPool.setWp(wp);
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
    public void uploadFile() throws Exception {
    	String workspaceKey = uploadFile(new File("src/test/resources/testData/VCFUploadResourceITCase.vcf"));
        System.out.println("Key: " + workspaceKey);
        assertEquals(1, count(workspaceKey));
    }
    
    public String uploadFile(File vcfFile) throws Exception {
    	
        VCFUploadResource uploadResource = new VCFUploadResource(mockHelper);

        InputStream inStream = new FileInputStream(vcfFile);

        String reporting = "FALSE";
        String compression = vcfFile.getName();
        Response r = uploadResource.uploadFile(DUMMY_USER_ID, DUMMY_ALIAS, reporting, compression, DUMMY_USER_TOKEN, inStream);

        verify(mockHelper).registerWorkspace(eq(DUMMY_USER_ID), eq(DUMMY_USER_TOKEN), anyString(), eq(DUMMY_ALIAS));

        //get the workspace id from the raw response and check there is one variant in there
        String json = r.getEntity().toString().replaceAll("File uploaded and workspace constructed :","");
        JsonElement jelement = new JsonParser().parse(json);
        JsonObject jobject = jelement.getAsJsonObject();
        String key = jobject.getAsJsonPrimitive("key").getAsString();

        // since the VCF import itself runs in a separate thread and the uploadFile()
        // returns before the import completes, it's necessary to check the status
        // until the import completes before doing any JUNIT assert statements
        waitForImportStatus(key, "workspace is ready");
        return key;
    }

    /**
     * Continuously polls the status of the given workspace.  If the status matches
     * the specified "expected" status, then the method will return.
     *
     * @param workspaceKey
     *      The key for the workspace to poll.
     * @param expectedStatus
     *      The "expected" status to check for.  The method will return when the workspace status
     *      matches this status value.
     * @throws InterruptedException
     *      Can potentially be thrown during the 1 second sleep between polls.
     */
    public void waitForImportStatus(String workspaceKey, String expectedStatus) throws InterruptedException {

        DB db = MongoConnection.getDB();

        DBCollection coll = db.getCollection(edu.mayo.util.Tokens.METADATA_COLLECTION);
        DBObject query = new BasicDBObject().append(edu.mayo.util.Tokens.KEY, workspaceKey);

        while (true) {
            DBObject dbo = coll.findOne(query);
            if (dbo.containsField("status")) {
                String status = (String) dbo.get("status");
                if (status.equals(expectedStatus)) {
                    return;
                }
            }
            Thread.sleep(1000);
        }

    }

    private long count(String workspace){
        ExeQuery q = new ExeQuery();
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        long count = q.countResults(col, new BasicDBObject());
        return count;
    }
}
