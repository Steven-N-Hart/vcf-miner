package edu.mayo.ve.FunctionalTests;

import com.mongodb.BasicDBList;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.*;
import edu.mayo.ve.resources.ExeQuery;
import edu.mayo.ve.resources.Provision;
import edu.mayo.ve.resources.TypeAheadResource;
import edu.mayo.ve.resources.Workspace;
import org.junit.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

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
    private static final String kgenome = "src/test/resources/testData/Asif1000G.vcf";
    private static String kgenomeworkspace = "";
    private static final String kalias = "kgenome";
    private static int overflowThreshold = 20;  //look below (after the class) for an explanation of why this was selected, for this dataset, we get some that overflow and some that do not, exactly what we want!

    public String getWorkspaceID(){ return workspaceID; }

    @BeforeClass
    public static void setUp() throws IOException, ProcessTerminatedException {
        workspaceID = load(softsearchVCF, alias);
        kgenomeworkspace = load(kgenome, "kgenomespart");
    }

    private static String load(String vcf, String alias) throws ProcessTerminatedException {
        String workspace;
        System.out.println("QuerryITCase.Provision a new workspace...");
        Provision prov = new Provision();
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        workspace = (String) w.get(Tokens.KEY);
        System.out.println("Workspace " + alias + " provisioned with key: " + workspace);

        System.out.println("QuerryITCase.Loading data into a new workspace...");
        VCFParser parser = new VCFParser();
        parser.parse(null, vcf, workspace, reporting, false);  //put true in the second to last param for verbose load reporting
        return workspace;
    }

    ExeQuery exeQuery = new ExeQuery();
    @Before
    public void setUpTest(){

    }

    //@AfterClass
    public static void tearDown()
    {
        //delete the workspace
        System.out.println("Deleting Workspace: " + workspaceID);
        Workspace w = new Workspace();
        w.deleteWorkspace(workspaceID);

        System.out.println("Deleting Workspace: " + kgenomeworkspace);
        w.deleteWorkspace(kgenomeworkspace);

    }


    /**
     * functonal test that ensures that the queries on the first 7 'fixed' fields work in concert with INFO queries and others.
     */
    @Test
    public void testFixedFieldQueries(){
        Querry q = new Querry();
        q.setWorkspace(workspaceID);
        q.setNumberResults(1000);
        //lets add a POS filter
        q.getFixedFieldNumberFilters().add(new FixedFieldNumberFilter("POS", 1000000.0,"$gt",false));
        //also, lets add filters for the value of ref
        q.getFixedFieldStringFilters().add(new FixedFieldStringFilter("REF", "$in", new ArrayList<String>(Arrays.asList("G")), false));
        //and add INFO filter
        q.getInfoNumberFilters().add(new InfoNumberFilter("ISIZE", 20.0, "$lt", false));

        System.out.println(q.createQuery().toString());

        DBObject r = runQueryAndExtractResults(q, 6);
        BasicDBList results = (BasicDBList) r.get("results");
        DBObject firstResult = (DBObject) results.get(0);
        System.out.println(firstResult.toString());
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
        assertEquals(756258, firstResult.get("POS"));
        assertEquals("chr1", firstResult.get("CHROM"));

        //add a sample filter
        SampleNumberFilter snf = new SampleNumberFilter("min","nSC",30.0,"$gte");
        ArrayList<SampleNumberFilter> snfilters = new ArrayList<SampleNumberFilter>();
        snfilters.add(snf);
        q.setSampleNumberFilters(snfilters);
        r = runQueryAndExtractResults(q, 3);
        results = (BasicDBList) r.get("results");
        firstResult = (DBObject) results.get(0);
        assertEquals(11031153, firstResult.get("POS"));
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

    @Test
    public void testCustomQuery(){
        Querry q = new Querry();
        DBObject r = null;
        q.setWorkspace(kgenomeworkspace);
        q.setNumberResults(10);//give back at most 10 results
        //custom
        ArrayList<SampleNumberFilter> customNumberFilters = new ArrayList<SampleNumberFilter>();
        SampleNumberFilter custom = new SampleNumberFilter("max","AD",10.0,"$gt");
        customNumberFilters.add(custom);
        q.setCustomNumberFilters(customNumberFilters);
        System.out.println("Running query: ");
        System.out.println(q.createQuery().toString());

        r = runQueryAndExtractResults(q, 458);

    }

    @Ignore("May 21, 2015 PHD - This functionality has been moved to aggregation pipeline.  Re-implement the test.")
    @Test
    public void testSampleGroups(){
        testSampleGroup("heterozygous",79);
        testSampleGroup("homozygous",0);

        //r = runQueryAndExtractResults(q, 30);
    }

    public void testSampleGroup(String zygocity, int expectedNumber){
        Querry q = new Querry();
        DBObject r = null;
        q.setWorkspace(workspaceID);
        q.setNumberResults(10);//give back at most 10 results

        //setup samples
        SampleGroup sampleGroup = new SampleGroup();
        ArrayList<String> samp = new ArrayList<String>();
        samp.add("NA12878.chr1.vcf"); samp.add("NA12891.chr1.vcf");  samp.add("NA12892.chr1.vcf");
        sampleGroup.setSamples(samp);
        sampleGroup.setZygosity(zygocity);

        ArrayList<SampleGroup> samples = new ArrayList<SampleGroup>();
        samples.add(sampleGroup);
        q.setSampleGroups(samples);
        r = runQueryAndExtractResults(q, expectedNumber);
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

    @Ignore("May 21, 2015 PHD - This functionality has been moved to aggregation pipeline.  Re-implement the test.")
    @Test
    public void testSampleGroupsWithZygocityAndAnyVSAll() throws ProcessTerminatedException {
        //this test needs to use its own vcf file and workspace...
        //provison the workspace
        Provision prov = new Provision();
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        String vcf = "src/test/resources/testData/zygosityTest.vcf";
        String workspace = (String) w.get(Tokens.KEY);
        System.out.println("Workspace for " + vcf + " provisioned with key: " + workspace);

        //load the VCF into the workspace
        VCFParser parser = new VCFParser();
        parser.setReporting(true);
        parser.parse(vcf, workspace);

        //
        // Use Case 1:
        //
        // 1. Show me my variant that has hetro in Z AND A -> returns nothing
        // db.we2f57f8275477cb26db93c42aa7323fd936d278b.find({ $and : [{"FORMAT.HeterozygousList" : { $in : ["Z"] } }, {"FORMAT.HeterozygousList" : { $in : ["A"] } }] } )
        //
        //
        zygoAllVSAll(workspace, Arrays.asList("Z","A"), "all", 0);

        //
        // Use Case 2:
        //
        // 2. Show me any variant that has X OR A hetro -> return one variant
        // db.we2f57f8275477cb26db93c42aa7323fd936d278b.find({"FORMAT.HeterozygousList" : { $in : ["X", "A"] } })
        //
        zygoAllVSAll(workspace, Arrays.asList("X","A"), "any", 1);

        //
        // Use Case 3:
        //
        // 3. Show me any variant where A AND Y are hetro -> variant line
        // db.we2f57f8275477cb26db93c42aa7323fd936d278b.find({ $and : [{"FORMAT.HeterozygousList" : { $in : ["Y"] } }, {"FORMAT.HeterozygousList" : { $in : ["A"] } }] } )
        //
        zygoAllVSAll(workspace, Arrays.asList("Y","A"), "all", 1);


    }

    private void zygoAllVSAll(String workspace, List<String> sampleList, String allAny, int expectedNumberResults){
        Querry q1 = new Querry();
        DBObject r = null;
        q1.setWorkspace(workspace);
        q1.setNumberResults(3);//There is only one result for this file!

        //setup samples
        SampleGroup sampleGroup = new SampleGroup();
        ArrayList<String> samp = new ArrayList<String>();
        for(String s: sampleList){
            samp.add(s);
        }
        sampleGroup.setSamples(samp);
        sampleGroup.setZygosity("heterozygous");
        sampleGroup.setAllAnySample(allAny);

        //setup the query
        ArrayList<SampleGroup> samples = new ArrayList<SampleGroup>();
        samples.add(sampleGroup);
        q1.setSampleGroups(samples);
        System.out.println(q1.createQuery().toString());

        //run the query
        r = runQueryAndExtractResults(q1, expectedNumberResults);
    }



}
