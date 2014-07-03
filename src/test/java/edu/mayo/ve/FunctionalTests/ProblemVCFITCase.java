package edu.mayo.ve.FunctionalTests;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.Tokens;
import edu.mayo.ve.CacheMissException;
import edu.mayo.ve.VCFParser.ErrorStats;
import edu.mayo.ve.VCFParser.VCFErrorFileUtils;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.index.Index;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SampleNumberFilter;
import edu.mayo.ve.resources.ExeQuery;
import edu.mayo.ve.resources.Provision;
import edu.mayo.ve.resources.TypeAheadResource;
import edu.mayo.ve.resources.Workspace;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.SystemProperties;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertTrue;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 1/23/14
 * Time: 9:43 AM
 * This tests VCF files that have been a problem in the past.
 */
public class ProblemVCFITCase {
    
//    public static void main(String[] args) throws IOException, ProcessTerminatedException{
//        ProblemVCFITCase pvcf = new ProblemVCFITCase();
//        pvcf.testAsif100G();
//    }
    
    Mongo m = MongoConnection.getMongo();
    private String user = "test";
    private int overflowThreshold = 50000;


//    @Test
//    public void testZhifu() throws IOException, ProcessTerminatedException{
//        String vcf = "/data/VCFExamples/zs002.variants.vcf";
//        load(vcf, false);
//        delete(vcf);
//    }

    @Test
    public void testAsif100G() throws IOException, ProcessTerminatedException {
        String vcf = "src/test/resources/testData/Asif1000G.vcf";
        //check to see if the type-ahead is indexed.
        DB database = m.getDB("workspace");
        DBCollection col = database.getCollection(Tokens.TYPEAHEAD_COLLECTION);
        Index index = new Index();
        DBObject raw = index.getIndexedFields(col);
        System.out.println("BEFORE LOAD"); //IN THIS CASE, TYPEAHEAD CAN BE INDEXED OR NOT, BOTH ARE FINE
        System.out.println(raw.toString());
        String workspace = load(vcf, false);
        raw = index.getIndexedFields(col);
        System.out.println("AFTER LOAD");  //HERE TYPEAHEAD SHOULD BE INDEXED
        System.out.println(raw.toString());
        deleteCheck(workspace, 0, 0);
        raw = index.getIndexedFields(col);
        System.out.println("AFTER DELETE"); //HERE TYPEAHEAD SHOULD NOT BE INDEXED
        System.out.println(raw.toString());
    }

    @Test
    public void testCaseControlSNPEFFHGVSAnnovar() throws IOException, ProcessTerminatedException {
        String vcf = "src/test/resources/testData/Case.control.snpeff.hgvs.annovar.part.vcf";
        String workspace = load(vcf, false);
        //tests.... (note this problem should create an error if it surfaces again)
        deleteCheck(workspace, 0,0);
    }

    //this test takes a LONG time to run, so commenting it out, run manually every now and then if you want to ensure functionality is still correct
    //it is more of a load test...
    //@Test
    public void testCaseControlSNPEFFHGVSAnnovar10k() throws IOException, ProcessTerminatedException {
        System.out.println("Loading 10k of a problem VCF");
        String vcf = "src/test/resources/testData/Case.control.snpeff.hgvs.annovar.10k.vcf.gz";
        String workspace = load(vcf, false);
        //tests
        //make sure there are ~10k records in the collection
        long count = count(workspace);
        assertEquals(9880,count);
        deleteCheck(workspace, 0,0);
    }

    @Test
    public void testAll_SamplesQuerry() throws IOException, ProcessTerminatedException {
        System.out.println("Loading All_Samples.snpeff.annotation.fixed.vcf.gz");
        String vcf = "src/test/resources/testData/All_Samples.snpeff.annotation.fixed.vcf.gz";
        String workspace =  load(vcf, false); //"w3a49942530f0e1e57756b20bc075695f7fd10f90";
        System.out.println("Workspace: " + workspace);
        //tests
        //make sure there are ~10k records in the collection
        long count = count(workspace);
        assertEquals(28324,count);

        System.out.println("Running a Query against the workspace: ");
        ExeQuery eq = new ExeQuery();
        //query that failed:
        //Sending query to server:{"numberResults":"1000","workspace":"w165228bf46fd17f043d0258f2b84220e92a47549","sampleGroups":[],"infoFlagFilters":[],"infoNumberFilters":[],"infoStringFilters":[],"sampleNumberFilters":[{"key":"AD","value":"5","comparator":"$gt","minORmax":"max","includeNulls":false}]}
        Querry q = new Querry();
        q.setNumberResults(1000);
        q.setWorkspace(workspace);
        //"sampleNumberFilters":[{"key":"AD","value":"5","comparator":"$gt","minORmax":"max","includeNulls":false}]
        SampleNumberFilter snf = new SampleNumberFilter("max","AD",5.0,"$gt");
        ArrayList<SampleNumberFilter> snfs = new ArrayList<SampleNumberFilter>( Arrays.asList(snf) );
        q.setSampleNumberFilters(snfs);
        String result = eq.handleBasicQuerry(q);
        System.out.println(result.substring(0,200));
        assertTrue(result.replaceAll("\\s+","").startsWith("{\"totalResults\":22747"));
        deleteCheck(workspace,0,0);
    }

    private long count(String workspace){
        ExeQuery q = new ExeQuery();
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        long count = q.countResults(col, new BasicDBObject());
        return count;
    }

    //this tests loading two files that are the same file one that is compressed and on that is not
    //the contents of the workspaces should be the same.
    @Test
    public void testCompressed() throws IOException, ProcessTerminatedException {
        System.out.println("Testing compression");
        String vcf = "src/test/resources/testData/annotated.functional.vcf";
        String zvcf = "src/test/resources/testData/Annotated.functional.vcf.gz"; //compressed version of the same file
        System.out.println("Loading uncompressed version");
        String workspace = load(vcf, false);
        System.out.println("Loading compressed version");
        String zworkspace = load(vcf, false);
        long count = count(workspace);
        System.out.println("Uncompressed Records Loaded: " + count);
        long zcount = count(zworkspace);
        System.out.println("Compressed Records Loaded: " + zcount);
        assertEquals(count, zcount);
        assertTrue(count != 0);
        deleteCheck(workspace,0,0);
        deleteCheck(zworkspace,0,0);
    }


    @Test
    public void testProblemDotMetadata() throws IOException, ProcessTerminatedException {
        String vcf = "src/test/resources/testData/Case.control.snpeff.hgvs.annovar.part300.vcf.gz";
        String workspace = load(vcf, false);
        //tests.... (note this problem should create an error if it surfaces again)
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        assertEquals(197, col.count());

        deleteCheck(workspace,0,0);
    }


    public String load(String inputVCF, boolean reporting) throws IOException, ProcessTerminatedException {
        System.out.println("Make sure to have MongoDB up and running on localhost (or wherever specified in your sys.properties file) before you try to run this functional test!");
        System.out.println("ProblemVCFITCase.Provision a new workspace...");
        Provision prov = new Provision();
        String alias = getAlias(inputVCF);
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        String workspaceID = (String) w.get(Tokens.KEY);
        System.out.println("Workspace provisioned with key: " + workspaceID);

        System.out.println("ProblemVCF.Loading data into a new workspace...");
        VCFParser parser = new VCFParser();
        parser.parse(null, inputVCF, workspaceID, overflowThreshold, false, reporting, false);  //put true in the second to last param for verbose load reporting
        parser.setTypeAhead(null);//remove the type-ahead, because it could be consuming too much ram...
        return workspaceID;
    }

    private String getAlias(String path){
        String[] tokens = path.split("/");
        return tokens[tokens.length-1];
    }

    public static void deleteCheck(String workspaceID, int errors, int warnings) throws IOException {
        System.out.println("Checking Statistics: ");
        SystemProperties sysprop = new SystemProperties();
        String tmp = sysprop.get("TEMPDIR");
        ErrorStats stats = VCFErrorFileUtils.calculateErrorStatistics(tmp + File.separator + workspaceID + ".errors");
        assertEquals(errors, stats.getErrors());
        assertEquals(warnings, stats.getWarnings());
        System.out.println("Deleting Workspace: " + workspaceID);
        Workspace w = new Workspace();
        w.deleteWorkspace(workspaceID);

    }

}
