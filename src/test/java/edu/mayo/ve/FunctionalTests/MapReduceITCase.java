package edu.mayo.ve.FunctionalTests;

//import com.mongodb.*;
import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SampleNumberFilter;
import edu.mayo.ve.resources.Provision;
import org.junit.Test;

import java.io.IOException;
import java.net.UnknownHostException;
import java.util.ArrayList;

/**
 * Created by m102417 on 9/15/14.
 *
 *
 *
 *
 */
public class MapReduceITCase {

    Mongo m = MongoConnection.getMongo();

    String alias = "alias";
    String user = "user";
    String workspace = "wf97ebceee6f4a102865de6859e8f0d26677aaf8f";//"w0979e20db867c2f412cb6a06cc07821fa5c55925";

    //this is a prototype for how we can get a map-reduce job to recalculate
    //uncomment this to get it to work
    //@Test
    public void f() throws Exception {
        String vcf = "src/test/resources/testData/Case.control.snpeff.hgvs.annovar.CADD_1500.vcf";
        //load(vcf);
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection("wa46da28f143284f2258e51dd5c0365d9d0dd4833"); //workspace    //
        //String outWorkspace = "mr" + workspace.replaceFirst("w","");
        String outWorkspace = "mr";

//        String map = "function() { "+
//                "var category; " +
//                "if ( this.pages >= 250 ) "+
//                "category = 'Big Books'; " +
//                "else " +
//                "category = 'Small Books'; "+
//                "emit(category, {name: this.name});}";
        //for this dude:
        // "CHROM" : "chr1",
        // "POS" : "537468",
        //        "ID" : ".",
        //        "REF" : "G",
        //        "ALT" : "T",
// s_Mayo_TN_CC_01 is wildtype
// s_Mayo_TN_CC_03 is homo
// s_Mayo_TN_CC_154 is hetro
        String map = "function() { " +
                    "var samples =  [\"s_Mayo_TN_CC_01\",\" s_Mayo_TN_CC_03\",\" s_Mayo_TN_CC_06\"];" +
                    "var hetrocount = 0;" +
                    "var homocount = 0;" +
                    "var wildcount = 0;" +
                    "for (sample in samples) {" +
                    "if(sample in this.FORMAT.HomozygousList ) { homocount = homocount + 1; } " +
                    "if(sample in this.FORMAT.HeterozygousList ) { hetrocount = hetrocount + 1; } " +
                    "if(sample in this.FORMAT.WildtypeList ) { wildcount = wildcount + 1; } " +
                    "}" +
                    "var newRecord = {};" +
                    "var CALCULATIONS = {};" +
                    "CALCULATIONS.hetrocount = hetrocount;" +
                    "CALCULATIONS.homocount = homocount;" +
                    "CALCULATIONS.wildcount = wildcount;" +
                    "CALCULATIONS.AC = hetrocount + 2*homocount;" +
                    "CALCULATIONS.AN = 2*hetrocount + 2*homocount + 2*wildcount;" +
                    "CALCULATIONS.AF = CALCULATIONS.AC / CALCULATIONS.AN;" +
                    "newRecord.CALCULATIONS = CALCULATIONS;" +
                    "newRecord.ORIGINAL = this;" +
                    "emit(this._id, newRecord); }";
//
//        String reduce = "function(key, values) { " +
//                "var sum = 0; " +
//                "values.forEach(function(doc) { " +
//                "sum += 1; "+
//                "}); " +
//                "return {books: sum};} ";
        String reduce = "function(key,value) { return value.ORIGINAL; } ";


        long start = System.currentTimeMillis();
        //MapReduceCommand.OutputType :: INLINE - Return results inline, no result is written to the DB server REPLACE - Save the job output to a collection, replacing its previous content MERGE - Merge the job output with the existing contents of outputTarget collection REDUCE - Reduce the job output with the existing contents of outputTarget collection
        MapReduceCommand cmd = new MapReduceCommand(col, map, reduce,
                outWorkspace, MapReduceCommand.OutputType.REPLACE, null);//getQuery());


        MapReduceOutput out = col.mapReduce(cmd);

        long end = System.currentTimeMillis();
        System.out.println("Time: " + (end-start));

//        for (DBObject o : out.results()) {
//            System.out.println(o.toString());
//        }

    }


    public DBObject getQuery(){
        Querry q = new Querry();
        DBObject r = null;
        q.setWorkspace(workspace);
        q.setNumberResults(10);//give back at most 10 results
        //custom
        ArrayList<SampleNumberFilter> customNumberFilters = new ArrayList<SampleNumberFilter>();
        SampleNumberFilter custom = new SampleNumberFilter("max","AD",10.0,"$gt");
        customNumberFilters.add(custom);
        q.setCustomNumberFilters(customNumberFilters);
        System.out.println("Running query: " + q.createQuery().toString());
        return q.createQuery();
    }

    public String load(String inputVCF) throws IOException, ProcessTerminatedException {
        System.out.println("Make sure to have MongoDB up and running on localhost (or wherever specified in your sys.properties file) before you try to run this functional test!");
        System.out.println("ProblemVCFITCase.Provision a new workspace...");
        Provision prov = new Provision();

        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        String workspaceID = (String) w.get(Tokens.KEY);
        System.out.println("Workspace provisioned with key: " + workspaceID);

        System.out.println("ProblemVCF.Loading data into a new workspace...");
        VCFParser parser = new VCFParser();
        parser.parse(inputVCF,workspaceID);
        //parser.parse(null, inputVCF, workspaceID, overflowThreshold, false, reporting, false);  //put true in the second to last param for verbose load reporting
        //parser.setTypeAhead(null);//remove the type-ahead, because it could be consuming too much ram...
        return workspaceID;
    }


//    @Test
//    public void f() throws UnknownHostException {
//        Mongo mongo;
//        mongo = new Mongo("biordev", 27017);
//        DB db = mongo.getDB("workspace");
//
//        String workspace = "w44733138b892809eba251e828388bbb5eaa0aed9";
//        DBCollection col = db.getCollection(workspace);
//
//        MapReduceCommand cmd = new MapReduceCommand(col, map, reduce,
//                null, MapReduceCommand.OutputType.INLINE, null);
//
//        MapReduceOutput out = col.mapReduce(cmd);
//
//        for (DBObject o : out.results()) {
//            System.out.println(o.toString());
//        }
//
//
//    }


}
