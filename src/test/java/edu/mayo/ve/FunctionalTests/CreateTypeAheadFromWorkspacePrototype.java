package edu.mayo.ve.FunctionalTests;

import com.mongodb.*;
import edu.mayo.util.MongoConnection;
import org.junit.Test;

/**
 * Created by m102417 on 12/19/14.
 */
public class CreateTypeAheadFromWorkspacePrototype {


    Mongo m = MongoConnection.getMongo();

    String alias = "alias";
    String user = "user";
    String workspace = "w530390f64fccc455973f2381f6dfe376d5267e2e";
    String outWorkspace = "mr";


    @Test
    public void f() throws Exception {
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);


        String map = "function() { " +
                "var next = this;" +
                "for(var p in next.INFO){" +
                    "var stats = {\"key\":p,\"value\":next.INFO[p],\"count\":1 }" +
                    "emit(\"INFO_\" + p, [stats]);" +
                "}";

        String reduce = "function(key,value) { " +
                "return value;" +
                "} ";


        String finalize = "";

        long start = System.currentTimeMillis();
        //MapReduceCommand.OutputType :: INLINE - Return results inline, no result is written to the DB server REPLACE - Save the job output to a collection, replacing its previous content MERGE - Merge the job output with the existing contents of outputTarget collection REDUCE - Reduce the job output with the existing contents of outputTarget collection
        MapReduceCommand cmd = new MapReduceCommand(col, map, reduce,
                outWorkspace, MapReduceCommand.OutputType.REPLACE, null);//getQuery());


        MapReduceOutput out = col.mapReduce(cmd);

        long end = System.currentTimeMillis();
        System.out.println("Time: " + (end-start));
    }

    /**
     * get the metadata that is of type 'string', we only want type-ahead for those fields.
     */
    public void getMetaData(){

    }

}
