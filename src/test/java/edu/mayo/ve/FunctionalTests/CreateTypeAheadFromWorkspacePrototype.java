package edu.mayo.ve.FunctionalTests;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.util.MongoConnection;
import org.junit.Before;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

/**
 * Created by m102417 on 12/19/14.
 */
public class CreateTypeAheadFromWorkspacePrototype {


    Mongo m = MongoConnection.getMongo();

    private String database = "workspace";
    String alias = "alias";
    String user = "user";
    String workspace = "wHASHRANDOM";
    String outWorkspace = "mr";


    //@Before
    @Test
    public void load() throws IOException {
        DB db = m.getDB(database);
        DBCollection col = db.getCollection(workspace);
        col.drop();//clean up before we insert
        BufferedReader br = new BufferedReader(new FileReader("src/test/resources/testData/variants.json"));
        String line;
        while((line = br.readLine()) != null){
            String tmp = line.replaceAll("ObjectId\\(.*\\)","\"value\"");//remove the _id, it is not valid json
            System.out.println(tmp);
            DBObject o = (DBObject) JSON.parse(tmp);
            o.removeField("_id");//remove the _id, it is not valid json
            System.out.println(o.toString());
            col.insert(o);
        }
        System.out.println("Number of Records: " + col.count());
    }


    @Test
    public void f() throws Exception {
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);

        String map =
        "function () {" +
            "for (var name in this.INFO) {" +

                "var value = this.INFO[name];" +

                "if (typeof value == 'string' || value instanceof String) {" +

                    "var key = name + '|' + value;" +
                    "emit(key, 1);" +
                "}" +
            "}" +
         "}";

        String reduce =
        "function (key, counts) {" +
            "return Array.sum(counts);" +
        "}";


//        String map = "function() { " +
//                "var next = this;" +
//                "for(var p in next.INFO){" +
//                    "var stats = {\"key\":p,\"value\":next.INFO[p],\"count\":1 }" +
//                    "emit(\"INFO_\" + p, [stats]);" +
//                "}";
//
//        String reduce = "function(key,value) { " +
//                "return value;" +
//                "} ";


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
