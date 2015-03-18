package edu.mayo.ve.FunctionalTests;

import static junit.framework.TestCase.assertFalse;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.Cursor;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.ve.LoaderPool;
import edu.mayo.ve.dbinterfaces.DatabaseImplMongo;
import edu.mayo.ve.message.InfoFlagFilter;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.Range;
import edu.mayo.ve.range.RangeWorker;
import edu.mayo.ve.resources.ExeQuery;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.ve.resources.RangeQueryInterface;


/**
 * Created by m102417 on 2/9/15.
 */
public class RangeITCase {

    //just use this for utility functions...
    private static ProblemVCFITCase util = new ProblemVCFITCase();
    private static String workspace = "wd092764710a636c967ed9d2b1944c24d64121b16";
    private static final String vcf = "src/test/resources/testData/Case.control.snpeff.hgvs.annovar.part300.vcf.gz";
    private static final String rangeFile = "src/test/resources/testData/Case.control.snpeff.hgvs.annovar.part.intervals";

    @BeforeClass
    public static void setup() throws Exception {
        workspace = util.load(vcf, false);
        System.out.println(workspace);
    }

    @AfterClass
    public static void teardown() throws Exception {
        util.deleteCheck(workspace,0,0);
    }

    //example insert
    //chr1	537602	.	C	CTCTCCATCCCCCCTCCATCCCCCTCTTTCTCCT
    //example delete
    //chr1	537591	.	TCTCCATCCCCC	T	21528.42
    //example snp
    //chr1	537589	.	T	C	13844.13
    @Test
    public void testRangeQuery() throws IOException, ProcessTerminatedException, ParseException, Exception {
        System.out.println("Loading 197 Variants to test interval queries");
        String rangeSetName = "RangeSet1";
        DatabaseImplMongo dbImplMongo = new DatabaseImplMongo();
        RangeQueryInterface rangeQ = new RangeQueryInterface(dbImplMongo, true);
        //tests
        //make sure there are 197 records in the collection
        long count = util.count(workspace);
        assertEquals(197,count);

        Range r1 = new Range("chr1:537589-537602");
        assertEquals(4, dbImplMongo.count(workspace, r1));
        Range r2 = new Range("chr1:537589-537589");
        assertEquals(1,dbImplMongo.count(workspace, r2));

        String updateRange = "chr1:537589-537602";
        List<String> rawRanges = Arrays.asList(updateRange);
        Cursor b = dbImplMongo.queryRange(workspace,new Range(updateRange));
        List<DBObject> before = new ArrayList<DBObject>();
        while(b.hasNext()){
            DBObject next = b.next();
            before.add(next);
        }
        //do the update
        int recordsUpdated = dbImplMongo.bulkUpdate(workspace, rawRanges.iterator(), 1, rangeSetName);
        //check that the update is correct.
        assertEquals(4,recordsUpdated);
        Cursor c = dbImplMongo.queryRange(workspace, new Range(updateRange));
        for(int i=0;c.hasNext();i++){
            DBObject next = c.next();
            BasicDBObject db = ((BasicDBObject) getBefore((String)next.get("CHROM"), (String)next.get("POS"), before));
            BasicDBObject info = (BasicDBObject) db.get("INFO");
            info = info.append(rangeSetName,true);
            db.put("INFO",info); //update the info so it matches what should be in the database
            db.removeField("_id");
            System.out.println("Actual:");
            System.out.println(next.toString());
            System.out.println("Expected:");
            System.out.println(db.toString());
            //the keys don't come out in the same order, so we need to test them using a method like CompareJSON.equals
            //however CompareJSON.equals does not make it easy to see what is missmatched, so I will go through key at a time
            for(String key : db.keySet()){
                System.out.println(key);
                if(key.equalsIgnoreCase("INFO")){
                    //info is the one that changed, so it needs special checking!
                    BasicDBObject dbINFO = (BasicDBObject) db.get("INFO");
                    BasicDBObject dbNEXT = (BasicDBObject) next.get("INFO");
                    for(String ikey : dbINFO.keySet()){
                        System.out.println("INFO." + ikey);
                        check(ikey, dbINFO, dbNEXT);
                    }
                } else {
                    check(key, db, next);
                }
            }
        }

        //now check that the query that is supposed to return the updated documents actually does
        BasicDBList rlist = qResults(rangeSetName);
        assertEquals(4, rlist.size()); //4 records in the database should have been marked.
//        for(int i=0; i<rlist.size();i++){
//            BasicDBObject next = (BasicDBObject) rlist.get(i);
//            System.out.println(next.toString());
//        }
//        System.out.println(results);

        //update the metadata... different seperate call than the bulk update, so need to call it manually
        String description = "Some Test Range Set";
        new DatabaseImplMongo().addInfoField(workspace, rangeSetName, 0, "Flag", description);

        //finally check that the update also updated the metadata.
        MetaData meta = new MetaData();
        String wjson = meta.getWorkspaceJSON(workspace);
        System.out.println(wjson);
        //check that a field that should not exist does not exist
        boolean exists = meta.checkFieldExists(workspace, "SomeFieldNotThere");
        assertFalse(exists);
        //check the field we added does exist
        exists = meta.checkFieldExists(workspace,"HEADER.INFO." + rangeSetName);
        assertTrue(exists);

    }

    /**
     * a simple query to check if the flagged results are indeed flagged
     * @param rangeSetName
     * @return
     */
    public BasicDBList qResults(String rangeSetName){
        //create the query object
        Querry q = new Querry();
        q.setWorkspace(workspace);
        q.setNumberResults(20); //there should only be 4 anyway...
        InfoFlagFilter rangeMarked = new InfoFlagFilter();
        rangeMarked.setKey(rangeSetName);
        ArrayList<InfoFlagFilter> filters = new ArrayList<InfoFlagFilter>();
        filters.add(rangeMarked);
        q.setInfoFlagFilters(filters);
        ExeQuery exec = new ExeQuery();
        System.out.println("Query: " + q.createQuery());
        String results = exec.handleBasicQuerry(q);
        DBObject dbObject = (DBObject) JSON.parse(results);
        BasicDBList rlist = (BasicDBList) dbObject.get("results");
        return rlist;
    }


    @Test
    public void testRESTENDPOINT() throws Exception {
        //startup the worker pool -- this is needed for the REST call to work
        LoaderPool pool = new LoaderPool();
        pool.setReportingTrueAndResetRangePool(true); //this is needed in a unit testing (should be fine in production)

        RangeQueryInterface rangeQ = new RangeQueryInterface(true); //set verbose mode
        String intervalsName = "INTERVALTESTREST";
        String description = "An Interval set that tests the REST interface to upload genomic intervals";
        String rangeSets = "chr1:231504-231557\nchr1:255909-255925";
        InputStream in = new FileInputStream(new File(rangeFile));
        rangeQ.uploadFile(workspace, intervalsName, description, rangeSets, in);


        //wait until the status is changed and all of the work is done
        System.out.println("Waiting for status to change to ready!");
        new VCFUploadResourceITCase().waitForImportStatus(workspace, "workspace is ready");
        //Thread.sleep(4000);

        //now build a query, there should be 20 records flagged with 'TESTREST'
        BasicDBList rlist = qResults(intervalsName);
        assertEquals(20, rlist.size());

        MetaData meta = new MetaData();
        String wjson = meta.getWorkspaceJSON(workspace);
        System.out.println(wjson);

        //check that the status of the workspace is updated to: "workspace is ready"
        DBObject dbObject = (DBObject) JSON.parse(wjson);
        String status = (String)dbObject.get("status");
        assertEquals("workspace is ready", status);

        //check the metadata for the field we added does exist
        boolean exists = meta.checkFieldExists(workspace, "HEADER.INFO." + intervalsName);
        assertTrue(exists);

        pool.shutdown(0);

    }


    /**
     * tests that the RangeWorker is doing the correct thing...
     */
    @Test
    public void testLogicInRangeWorker() throws Exception {

        String intervalsName = "BACKGROUNDPROC";
        String intervalsDesc = "Some description here";
        RangeQueryInterface rangeQ = new RangeQueryInterface();
        RangeWorker worker = new RangeWorker();
        Task<HashMap,HashMap> t = rangeQ.getTask(workspace, new File(rangeFile), intervalsName, intervalsDesc, 1);
        //update the metadata manually because it is not in the front end call
        new DatabaseImplMongo().addInfoField(workspace, intervalsName, 0, "Flag", "test on the background worker");

        //update the collection outside of the thread pool
        worker.compute(t);


        //check that the workspace is indeed updated correctly
        BasicDBList rlist = qResults(intervalsName);
        assertEquals(16, rlist.size());


    }

    /**
     * tests the logic on name validation (the part that makes sure the key is not in the workspace only)
     */
    @Test
    public void testValidateName(){
        DatabaseImplMongo mDbInterface = new DatabaseImplMongo();
        assertFalse(mDbInterface.isInfoFieldExists(workspace, "FOOBARBAZ"));
        assertTrue(mDbInterface.isInfoFieldExists(workspace, "LOF"));
    }



    public void check(String key, DBObject db, DBObject next){
        try {
            String expected = db.get(key).toString();
            String actual = next.get(key).toString();
            System.out.println("Expected: " + expected);
            System.out.println("Actual: " + actual);
            assertEquals(expected, actual);
        }catch(Exception e){
            int foo=1;
        }
    }

    /**
     * stupid utility function because the objects may not come back in exactly the same order :(
     * chr/pos uniquely finds in the list a given dbObject that matches given a list of all dbObjects in the range
     * use this only in tests NOT production!
     * @param chr
     * @param pos
     * @param dbObjects
     */
    public DBObject getBefore(String chr, String pos, List<DBObject> dbObjects) throws Exception {
        for(DBObject o : dbObjects){
            String c = (String) o.get("CHROM");
            String p = (String) o.get("POS");
            if(c.equalsIgnoreCase(chr) && p.equalsIgnoreCase(pos)){
                o.removeField("_id");
                return o;
            }
        }
        throw new Exception("you obviously don't know how to use this function!");
        //if we get here there is a problem!
    }





}
