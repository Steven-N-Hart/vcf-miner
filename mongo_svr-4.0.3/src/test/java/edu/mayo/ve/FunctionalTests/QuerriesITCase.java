package edu.mayo.ve.FunctionalTests;

import com.jayway.jsonpath.JsonPath;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.securityuserapp.client.SessionExpiredClientException;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.resources.Queries;
import edu.mayo.ve.resources.Workspace;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import javax.ws.rs.WebApplicationException;
import java.io.File;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class QuerriesITCase {

    private final static long   RANDOM_LONG         = (new Random(System.currentTimeMillis()).nextLong());
    private final static String DUMMY_USER_ID       = "user_id_" + RANDOM_LONG;
    private final static String DUMMY_USER_TOKEN    = "user_token_" + RANDOM_LONG;
    private final static String DUMMY_EXPIRED_TOKEN = "expired_user_token_" + RANDOM_LONG;
    private final static String DUMMY_ALIAS         = "alias_" + RANDOM_LONG;

    private static String workspaceKey;

    private SecurityUserAppHelper mockHelper;

    @BeforeClass
    public static void setupMongoDB() throws ProcessTerminatedException {
        File vcf = new File("src/test/resources/testData/QuerriesITCase.vcf");
        workspaceKey = FunctionalTestUtil.load(vcf, DUMMY_USER_ID, DUMMY_ALIAS, 20, false);
    }

    @AfterClass
    public static void tearDownMongoDB() {
        Workspace w = new Workspace();
        w.deleteWorkspace(workspaceKey);
    }

    @Before
    public void setupMocks() throws Exception {

        mockHelper = mock(SecurityUserAppHelper.class);

        Set<String> workspaceKeys = new HashSet<String>();
        workspaceKeys.add(workspaceKey);

        when(mockHelper.getAuthorizedWorkspaces(DUMMY_USER_TOKEN)).thenReturn(workspaceKeys);
        when(mockHelper.getAuthorizedWorkspaces(DUMMY_EXPIRED_TOKEN)).thenThrow(SessionExpiredClientException.class);
    }

    @Test
    public void getWorkspaceJSON() throws Exception {

        Queries queries = new Queries(mockHelper);

        String json = queries.getWorkspaceJSON(DUMMY_USER_ID, DUMMY_USER_TOKEN);


        assertEquals(workspaceKey,         JsonPath.compile("0.key").read(json));
        assertEquals(DUMMY_ALIAS,          JsonPath.compile("0.alias").read(json));
        assertEquals(DUMMY_USER_ID,        JsonPath.compile("0.owner").read(json));

        // ##INFOs
        assertEquals(1,                    JsonPath.compile("0.HEADER.INFO.INFO1.number").read(json));
        assertEquals("String",             JsonPath.compile("0.HEADER.INFO.INFO1.type").read(json));
        assertEquals("String info field",  JsonPath.compile("0.HEADER.INFO.INFO1.Description").read(json));
        assertEquals(0,                    JsonPath.compile("0.HEADER.INFO.INFO2.number").read(json));
        assertEquals("Flag",               JsonPath.compile("0.HEADER.INFO.INFO2.type").read(json));
        assertEquals("Flag info field",    JsonPath.compile("0.HEADER.INFO.INFO2.Description").read(json));
        assertEquals(1,                    JsonPath.compile("0.HEADER.INFO.INFO3.number").read(json));
        assertEquals("Integer",            JsonPath.compile("0.HEADER.INFO.INFO3.type").read(json));
        assertEquals("Integer info field", JsonPath.compile("0.HEADER.INFO.INFO3.Description").read(json));
        assertEquals(1,                    JsonPath.compile("0.HEADER.INFO.INFO4.number").read(json));
        assertEquals("Float",              JsonPath.compile("0.HEADER.INFO.INFO4.type").read(json));
        assertEquals("Float info field",   JsonPath.compile("0.HEADER.INFO.INFO4.Description").read(json));

        // ## FORMATs
        assertEquals(1,                    JsonPath.compile("0.HEADER.FORMAT.FORMAT1.number").read(json));
        assertEquals("Integer",            JsonPath.compile("0.HEADER.FORMAT.FORMAT1.type").read(json));
        assertEquals("Integer format field", JsonPath.compile("0.HEADER.FORMAT.FORMAT1.Description").read(json));

        // ##METAs
        assertEquals(1,                    JsonPath.compile("0.HEADER.META.META1.number").read(json));
        assertEquals("Float",              JsonPath.compile("0.HEADER.META.META1.type").read(json));
        assertEquals("A float field",      JsonPath.compile("0.HEADER.META.META1.Description").read(json));
        assertEquals(Arrays.asList(21.0, 30.3, 42.7),     JsonPath.compile("0.HEADER.META.META1.Values").read(json));
        assertEquals(1,                    JsonPath.compile("0.HEADER.META.META2.number").read(json));
        assertEquals("String",             JsonPath.compile("0.HEADER.META.META2.type").read(json));
        assertEquals("A string field",     JsonPath.compile("0.HEADER.META.META2.Description").read(json));
        assertEquals(Arrays.asList("PASS", "FAIL"),     JsonPath.compile("0.HEADER.META.META2.Values").read(json));
        assertEquals(0,                    JsonPath.compile("0.HEADER.META.META3.number").read(json));
        assertEquals("Flag",               JsonPath.compile("0.HEADER.META.META3.type").read(json));
        assertEquals("A flag field",       JsonPath.compile("0.HEADER.META.META3.Description").read(json));
        assertEquals(Arrays.asList(),      JsonPath.compile("0.HEADER.META.META3.Values").read(json));
        assertEquals(1,                    JsonPath.compile("0.HEADER.META.META4.number").read(json));
        assertEquals("Integer",            JsonPath.compile("0.HEADER.META.META4.type").read(json));
        assertEquals("An integer field",   JsonPath.compile("0.HEADER.META.META4.Description").read(json));
        assertEquals(Arrays.asList(51, 78, 109),     JsonPath.compile("0.HEADER.META.META4.Values").read(json));

        JsonPath.compile("0.SAMPLES.SAMPLE1").read(json);

        System.out.println(json);
    }

    @Test (expected = WebApplicationException.class)
    public void getWorkspaceJSONExpiredToken() throws Exception {

        Queries queries = new Queries(mockHelper);

        queries.getWorkspaceJSON(DUMMY_USER_ID, DUMMY_EXPIRED_TOKEN);
    }

}
