package edu.mayo.ve.FunctionalTests;

import com.mongodb.BasicDBList;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.InfoStringFilter;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SampleNumberFilter;
import edu.mayo.ve.resources.ExeQuery;
import edu.mayo.ve.resources.Provision;
import edu.mayo.ve.resources.TypeAheadResource;
import edu.mayo.ve.resources.Workspace;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;

import static org.junit.Assert.assertEquals;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 1/7/14
 * Time: 1:21 PM
 * This class tests queries being run to a MongoDB Backend via the Querry Object --- Look at QuerryTest for the tests on how these queries are constructed
 */
public class QuerryITCase {

    private static final String softsearchVCF = "src/test/resources/testData/SoftSearch_for_Dan.vcf";
    private static final boolean reporting = false;//"FALSE"; //"TRUE";
    private static final String user = "test";
    private static final String alias = "TypeAheadITCaseTestVCF";
    private static String workspaceID = "w34f826f14dd8dbde823345c4c7b1543bbf64658c";
    private static int overflowThreshold = 20;  //look below (after the class) for an explanation of why this was selected, for this dataset, we get some that overflow and some that do not, exactly what we want!

    public String getWorkspaceID(){ return workspaceID; }

    @BeforeClass
    public static void setUp() throws IOException, ProcessTerminatedException {
        System.out.println("QuerryITCase.Provision a new workspace...");
        Provision prov = new Provision();
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        workspaceID = (String) w.get(Tokens.KEY);
        System.out.println("Workspace provisioned with key: " + workspaceID);

        System.out.println("QuerryITCase.Loading data into a new workspace...");
        VCFParser parser = new VCFParser();
        parser.parse(null, softsearchVCF, workspaceID, overflowThreshold, reporting, false, true);  //put true in the second to last param for verbose load reporting

    }

    ExeQuery exeQuery = new ExeQuery();
    @Before
    public void setUpTest(){

    }

    @AfterClass
    public static void tearDown()
    {
        //delete the workspace
        System.out.println("Deleting Workspace: " + workspaceID);
        Workspace w = new Workspace();
        w.deleteWorkspace(workspaceID);

    }

    @Test
    public void testSampleFormatQueries(){
        Querry q = new Querry();
        DBObject r = null;
        q.setWorkspace(workspaceID);
        q.setNumberResults(10);//give back at most 10 results

        r = runQueryAndExtractResults(q, 79);

        BasicDBList results = (BasicDBList) r.get("results");
        assertEquals(10, results.size());
        DBObject firstResult = (DBObject) results.get(0);
        assertEquals("756258", firstResult.get("POS"));
        assertEquals("chr1", firstResult.get("CHROM"));

        //add a sample filter
        SampleNumberFilter snf = new SampleNumberFilter("min","nSC",30.0,"$gte");
        ArrayList<SampleNumberFilter> snfilters = new ArrayList<SampleNumberFilter>();
        snfilters.add(snf);
        q.setSampleNumberFilters(snfilters);
        r = runQueryAndExtractResults(q, 3);
        results = (BasicDBList) r.get("results");
        firstResult = (DBObject) results.get(0);
        assertEquals("11031153", firstResult.get("POS"));
        assertEquals("chr1", firstResult.get("CHROM"));

        //check a compound query
        SampleNumberFilter minSC = new SampleNumberFilter("min","nSC",30.0,"$gte");
        SampleNumberFilter maxuRP = new SampleNumberFilter("max","uRP",77.0,"$lte");
        snfilters = new ArrayList<SampleNumberFilter>();
        snfilters.add(minSC);
        snfilters.add(maxuRP);
        ArrayList<String> values = new ArrayList(Arrays.asList("BND"));
        InfoStringFilter svtype = new InfoStringFilter("SVTYPE", values, "$in", false); //also works as INFO.SVTYPE
        ArrayList<InfoStringFilter> infoStringFilters = new ArrayList<InfoStringFilter>(Arrays.asList(svtype));
        q.setSampleNumberFilters(snfilters);
        q.setInfoStringFilters(infoStringFilters);
        r = runQueryAndExtractResults(q, 2);
        String resultQ = "{ \"$and\" : [ { \"$and\" : [ { \"FORMAT.min.nSC\" : { \"$gte\" : 30.0}} , { \"FORMAT.max.uRP\" : { \"$lte\" : 77.0}}]} , { \"INFO.SVTYPE\" : { \"$in\" : [ \"BND\"]}}]}";
        assertEquals(resultQ, q.createQuery().toString());
        //feel free to make this functional test more complex to handle more scenarios!
    }

    /**
     * convienence method...
     * runs the query, checks that the number or results return is correct and returns a parsed result of the query
     * @param q
     * @param numberCheck
     * @return
     */
    private DBObject runQueryAndExtractResults(Querry q, int numberCheck){
        String json = exeQuery.handleBasicQuerry(q);
        System.out.println(json);
        DBObject r = (DBObject) JSON.parse(json);
        int totalResults = new Integer((Integer) r.get("totalResults"));
        assertEquals(numberCheck, totalResults);
        return r;
    }

}
