package edu.mayo.ve.FunctionalTests;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.TypeAhead.TypeAheadCollection;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.CompareJSON;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;
import edu.mayo.ve.CacheMissException;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.resources.Provision;
import edu.mayo.ve.resources.*;
import edu.mayo.ve.resources.Workspace;
import org.junit.*;

import javax.ws.rs.PathParam;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import static org.junit.Assert.*;
import static org.junit.Assert.assertEquals;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 12/31/13
 * Time: 9:06 AM
 * NOTE to use this FunctionalTest, you MUST have MongoDB up and availible on the configured port.
 * NOTE2 - if you attempt to run this functional test at the same time with multiple users, I can not guarentee it's safety!
 */
public class TypeAheadITCase {

    private static final String inputVCF = "src/test/resources/testData/TNBC_Cases_Controls.snpeff.annotation.vcf";
    private static final String reporting = "TRUE";//"FALSE"; //"TRUE";
    private static final String user = "test";
    private static final String alias = "TypeAheadITCaseTestVCF";
    private static String workspaceID = "w9222d43a55b3c496ed07cb75c9b3414f6ac8a7c5";
    private static int overflowThreshold = 20;  //look below (after the class) for an explanation of why this was selected, for this dataset, we get some that overflow and some that do not, exactly what we want!

    public String getWorkspaceID(){ return workspaceID; }

    @BeforeClass
    public static void setUp() throws IOException, ProcessTerminatedException {
        System.out.println("Make sure to have MongoDB up and running on localhost (or wherever specified in your sys.properties file) before you try to run this functional test!");
        System.out.println("TypeAheadITCase.Provision a new workspace...");
        Provision prov = new Provision();
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        workspaceID = (String) w.get(Tokens.KEY);
        System.out.println("Workspace provisioned with key: " + workspaceID);

        System.out.println("TypeAheadITCase.Loading data into a new workspace...");
        VCFParser parser = new VCFParser();
        parser.parse(null, inputVCF, workspaceID, overflowThreshold, false, false, true);  //put true in the third to last param for verbose load reporting

    }

    TypeAheadResource tar;
    @Before
    public void setUpTest(){
        tar = new TypeAheadResource();
    }

    @AfterClass
    public static void tearDown()
    {
        //delete the workspace
        System.out.println("Deleting Workspace: " + workspaceID);
        Workspace w = new Workspace();
        w.deleteWorkspace(workspaceID);
        TypeAheadCollection tac = new TypeAheadCollection();
        tac.clear();

    }

    private final String GenotyperControlsResult = "{ INFO.GenotyperControls = [ \"Samtools\" , \"Pindel\" , \"Samtools-Pindel\"] }";
    @Test
    public void testGetTypeAhead4Value(){
        System.out.println("TestGetTypeAhead4Value");
        String json = tar.getTypeAhead4Value(workspaceID, "INFO.GenotyperControls");
        DBObject expected = (DBObject) JSON.parse(json);
        DBObject result = (DBObject) JSON.parse(json);
        CompareJSON.equals((BasicDBList) expected.get("INFO.GenotyperControls"),(BasicDBList) result.get("INFO.GenotyperControls") );
        //assertEquals(GenotyperControlsResult,result.get("INFO.GenotyperControls").toString());
        assertTrue(result.keySet().size() == 1); //one for the specific attribute
    }

    /**
       The load will place the following in the typeahead collection:
     "SNPEFF_IMPACT" : [
        "HIGH",
        "MODERATE",
        "LOW",
        "MODIFIER"
     ]
     This test will make sure that we can get this from the cache (mongodb typeahead collection)
     */
//    @Test
//    public void testGetTypeAheadFromMongoCache() throws CacheMissException {
//        System.out.println("TestGetTypeAheadFromMongoCache");
//        BasicDBList result = tar.getTypeAheadFromMongoCache(workspaceID,"SNPEFF_IMPACT","",1000); //get all the values (there are 4)
//        String expected = "[ \"HIGH\" , \"MODERATE\" , \"LOW\" , \"MODIFIER\"]";
//        assertEquals(expected,result.toString());
//        //check if reducing max values returned works
//        result = tar.getTypeAheadFromMongoCache(workspaceID,"SNPEFF_IMPACT","",1); //get all the values (there are 4)
//        expected = "[ \"HIGH\"]";
//        assertEquals(expected,result.toString());
//        //check to see if prefix works
//        result = tar.getTypeAheadFromMongoCache(workspaceID,"SNPEFF_IMPACT","FOO",100); //get all the values (there are 4)
//        expected = "[ ]";
//        assertEquals(expected,result.toString());
//        result = tar.getTypeAheadFromMongoCache(workspaceID,"SNPEFF_IMPACT","MOD",1); //get all the values (there are 4)
//        expected = "[ \"MODERATE\"]";
//        assertEquals(expected,result.toString());
//        result = tar.getTypeAheadFromMongoCache(workspaceID,"SNPEFF_IMPACT","MOD",100); //get all the values (there are 4)
//        expected = "[ \"MODERATE\" , \"MODIFIER\"]";
//        assertEquals(expected,result.toString());
//    }
//
//    @Test
//    public void testGetTypeAheadFromMongoIndex() throws CacheMissException {
//        System.out.println("testGetTypeAheadFromMongoIndex");
//        BasicDBList result = tar.getTypeAheadFromMongoIndex(workspaceID,"SNPEFF_IMPACT","",1000);
//        String expected = "[ \"HIGH\" , \"LOW\" , \"MODERATE\" , \"MODIFIER\"]";
//        assertEquals(expected,result.toString());
//        result = tar.getTypeAheadFromMongoIndex(workspaceID,"SNPEFF_IMPACT","M",1000);
//        expected = "[ \"MODERATE\" , \"MODIFIER\"]";
//        assertEquals(expected,result.toString());
//        //check that it is case sensitive
//        result = tar.getTypeAheadFromMongoIndex(workspaceID,"SNPEFF_IMPACT","m",1000);
//        expected = "[ ]";
//        assertEquals(expected,result.toString());
//        result = tar.getTypeAheadFromMongoIndex(workspaceID,"SNPEFF_IMPACT","M",1);
//        expected = "[ \"MODERATE\"]";
//        assertEquals(expected,result.toString());
//        result = tar.getTypeAheadFromMongoIndex(workspaceID,"SNPEFF_GENE_NAME","M",1);
//        expected = "[ \"MIB2\"]";
//        assertEquals(expected,result.toString());
//    }

    @Test
    public void testGetTypeAhead4Value4Params(){
        //test iterations where you hit the cache or the index!
        //example where you go to the index to get the values
        String result = tar.getTypeAhead4Value(workspaceID,"INFO.SNPEFF_GENE_NAME","M",100000);
        String expected = "{ \"INFO.SNPEFF_GENE_NAME\" : [ \"MIB2\" , \"MIR200A\" , \"MRPL20\" , \"MXRA8\"]}";
        assertTrue( CompareJSON.equals(expected,result) );
        //assertEquals(expected,result);
        //example where you go to the cache, because it it not indexed
        //	"GenotyperControls" : [
        //"Samtools-Pindel",
        //        "Pindel",
        //        "Samtools"
        //],
        result = tar.getTypeAhead4Value(workspaceID,"INFO.GenotyperControls","",100000);
        expected = "{ \"INFO.GenotyperControls\" : [ \"Samtools\" , \"Pindel\" , \"Samtools-Pindel\"]}";
        assertTrue( CompareJSON.equals(expected,result) );
        //assertEquals(expected,result);
        //Checking that prefixes work
        result = tar.getTypeAhead4Value(workspaceID,"INFO.GenotyperControls","Sam",100000);
        expected = "{ \"INFO.GenotyperControls\" : [ \"Samtools\" , \"Samtools-Pindel\"]}";
        assertTrue( CompareJSON.equals(expected,result) );
        //assertEquals(expected,result);
        //example where there are no values in the database to type-ahead
        result = tar.getTypeAhead4Value(workspaceID,"INFO.CGT","",100000);
        expected = "{ \"INFO.CGT\" : [ ]}";  //all of the values for this are null, so this is the response
        assertEquals(expected,result);

    }

    @Test
    public void testGetDistinctCount4Field() throws IOException, CacheMissException {
        System.out.println("testGetDistinctCount4Field");

        //field is not indexed but it is much less than threshold, so correct
        String json = tar.getDistinctCount4Field(workspaceID, "GenotyperControls");
        DBObject r = (DBObject) JSON.parse(json);
        int count = (Integer) r.get("count");
        assertEquals(3, count);

        //example, field is indexed, so we can get an exact count
        json = tar.getDistinctCount4Field(workspaceID, "SNPEFF_GENE_NAME");
        r = (DBObject) JSON.parse(json);
        count = (Integer) r.get("count");
        assertEquals(56, count);

        //field is NOT indexed and there are no values for the field... return 0
        json = tar.getDistinctCount4Field(workspaceID, "HOMSEQ");
        r = (DBObject) JSON.parse(json);
        count = (Integer) r.get("count");
        //assertEquals(Integer.MAX_VALUE, count);
        assertEquals(0, count);

        Index index = new Index();
        String status = index.dropFieldIndex(workspaceID, "INFO.SNPEFF_AMINO_ACID_CHANGE");
        System.out.println(status);
        //now do the test...
        json = tar.getDistinctCount4Field(workspaceID, "SNPEFF_AMINO_ACID_CHANGE");    //can prefix with INFO or not...
        r = (DBObject) JSON.parse(json);
        count = (Integer) r.get("count");
        assertEquals(32, count);
        //place the index back
        status = index.createFieldIndex(workspaceID, "INFO.SNPEFF_AMINO_ACID_CHANGE");
        System.out.println(status);
    }

    @Test
    public void testTypeAheadOnArray() throws IOException, ProcessTerminatedException, CacheMissException {
        ProblemVCFITCase p = new ProblemVCFITCase();
        String vcf = "src/test/resources/testData/CustomCapture.anno5000.vcf";
        String workspace = "w08479e4f019bb4f875b76b4e21153054a258f809";
        workspace = p.load(vcf, false);
        System.out.println(workspace);
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        assertEquals(4856, col.count());

        TypeAheadResource tar = new TypeAheadResource();
        String snpeff_gene_name_count = tar.getDistinctCount4Field(workspace, "INFO.SNPEFF_GENE_NAME");
        System.out.println(snpeff_gene_name_count);
        List<String> expectedEff = Arrays.asList("HIGH", "LOW", "MODERATE", "MODIFIER");

        String tajson = tar.getDistinctCount4Field(workspace,"INFO.SNPEFF_Effect_impact");
        assertTrue(tajson.contains("\"count\" : 4"));
        String tajson2 = tar.getTypeAhead4Value(workspace, "INFO.SNPEFF_Effect_impact");
        DBObject dbo = (DBObject) JSON.parse(tajson2);
        BasicDBList eff = (BasicDBList) dbo.get("INFO.SNPEFF_Effect_impact");
        System.out.println(tajson2);
        for(Object o : eff){
            String s = (String) o;
            assertTrue(expectedEff.contains(s));
        }

        p.deleteCheck(workspace, 0, 0);
    }


}

/**
 * test for this dataset:
 * r0240560:VCFExamples m102417$ cat TNBC_Cases_Controls.snpeff.annotation.vcf | bior_vcf_to_tjson | grep -v "^#" | bior_drill -p INFO.SNPEFF_GENE_NAME | cut -f 898 | sort | uniq -c
 1 ##BIOR=<ID="bior..#UNKNOWN_898.INFO.SNPEFF_GENE_NAME",Operation="bior_drill",DataType="String",ShortUniqueName="",Path="">
 176 .
 17 ACAP3
 56 AGRN
 5 ATAD3A
 3 ATAD3B
 1 ATAD3C
 3 AURKAIP1
 7 B3GALT6
 22 C1orf159
 1 C1orf170
 28 C1orf233
 8 CALML6
 11 CCNL2
 1 CDK11A
 27 CDK11B
 12 CPSF3L
 8 DDX11L1
 6 DVL1
 1 FAM132A
 31 FAM41C
 5 GABRD
 33 GNB1
 10 HES4
 8 ISG15
 37 KIAA1751
 7 KLHL17
 4 LINC00115
 3 LOC100130417
 1 LOC100133331
 4 LOC100288069
 24 LOC254099
 16 LOC643837
 15 MIB2
 6 MIR200A
 6 MRPL20
 7 MXRA8
 8 NADK
 7 NOC2L
 36 OR4F16
 25 PLEKHN1
 18 PRKCZ
 1 PUSL1
 6 RNF223
 17 SAMD11
 9 SCNN1D
 3 SDF4
 9 SLC35E2
 9 SLC35E2B
 6 SSU72
 1 TAS1R3
 2 TMEM240
 10 TMEM52
 5 TMEM88B
 22 TTLL10
 7 UBE2J2
 8 VWA1
 7 WASH7P
 1 bior.OWN_898.INFO.SNPEFF_GENE_NAME
 r0240560:VCFExamples m102417$ cat TNBC_Cases_Controls.snpeff.annotation.vcf | bior_vcf_to_tjson | grep -v "^#" | bior_drill -p INFO.SNPEFF_EFFECT | cut -f 898 | sort | uniq -c
 1 ##BIOR=<ID="bior..#UNKNOWN_898.INFO.SNPEFF_EFFECT",Operation="bior_drill",DataType="String",ShortUniqueName="",Path="">
 2 .
 2 CODON_CHANGE_PLUS_CODON_DELETION
 2 CODON_INSERTION
 183 DOWNSTREAM
 11 EXON
 5 FRAME_SHIFT
 174 INTERGENIC
 37 INTRAGENIC
 282 INTRON
 12 NON_SYNONYMOUS_CODING
 11 SYNONYMOUS_CODING
 99 UPSTREAM
 3 UTR_3_PRIME
 3 UTR_5_PRIME
 1 bior.OWN_898.INFO.SNPEFF_EFFECT
 r0240560:VCFExamples m102417$
 *
 *
 *
 *
 */
