package edu.mayo.ve.resources;

import com.google.gson.Gson;
import com.mongodb.*;
import edu.mayo.query.*;
import edu.mayo.query.QueryBuilder;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.Rresults;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.message.SampleGroup;
import org.codehaus.jackson.map.ObjectMapper;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 6/21/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */
@Path("/ve/eq")
public class ExeQuery {
    Mongo m = MongoConnection.getMongo();
    Gson gson = new Gson();

    //canidate function to replace handleBasicQuerry and handleBasicQuerry2 below (makes them a lot more simple!)
    @POST
    @Produces("application/json")
    @Consumes(MediaType.APPLICATION_JSON)
    public String handleBasicQuery(Querry q) throws Exception {
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(q.getWorkspace());
        Rresults results = new Rresults();

        //setup the cursor
        QueryFactory qfact = new QueryFactory();
        QueryCursorInterface cursor = qfact.makeCursor(col,q);

        //count the number of results and put them in the response message... (do we want to do this async? - for some queries this takes time)
        results.setNumberOfResults(cursor.countResults());

        //string-ify the query that was used to generate the results, and put that in the response message (mostly for debugging)
        results.setMongoQuery(cursor.getQuery());

        for(int i = 0; i< q.getNumberResults() && cursor.hasNext();i++){
            DBObject next = cursor.next();
            results.addResult(next);
        }

        return results.asJson();
    }

    //@POST
    //@Path("/aggregate")
    //@Produces("application/json")
    //@Consumes(MediaType.APPLICATION_JSON)
    public String handleBasicQuerry2(Querry q) throws Exception {

        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(q.getWorkspace());

        Rresults results = new Rresults();

        // conditionally run everything through an Aggregation Pipeline if warranted
        if (q.getSampleGroups().size() >= 1) {

            // construct a pipeline of stages
            List<DBObject> stages = QueryBuilder.buildAggregationPipeline(q);

            // get count in separate thread
            CountThread countThread = new CountThread(col, stages);
            countThread.start();
            // wait for separate thread to finish
            countThread.join();
            results.setNumberOfResults((long) countThread.getCount());

            // limit number of results
            stages.add(new BasicDBObject("$limit", q.getNumberResults()));

            results.setMongoQuery(stages.toString());

            // run aggregation pipeline that returns a cursor to the result collection
            AggregationOptions aggregationOptions = AggregationOptions.builder()
                    .outputMode(AggregationOptions.OutputMode.CURSOR)
                    .build();
            Cursor cursor = col.aggregate(stages, aggregationOptions);

            while (cursor.hasNext()) {
                DBObject result = cursor.next();
                results.addResult(result);
            }

            return results.asJson();
        } else {
            return handleBasicQuerry(q);
        }
    }

    //@POST
    //@Path("/ve/eq")
    //@Produces("application/json")
    //@Consumes(MediaType.APPLICATION_JSON)
    public String handleBasicQuerry(Querry q){
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(q.getWorkspace());
        DBObject query = q.createQuery();
        Rresults results = new Rresults();

        //count the number of results and put them in the response message...
        results.setNumberOfResults(col.count(query));

        results.setMongoQuery(query.toString());
        //System.out.println(query.toString());

        //extract the first N results and return them in the response message
        DBCursor documents = col.find(query, q.getReturnSelect());
        for(int i = 0; i< q.getNumberResults() && documents.hasNext();i++){
            DBObject next = documents.next();
            results.addResult(next);
        }

        ObjectMapper mapper = new ObjectMapper();

        return results.asJson();
    }

    public Long countResults(DBCollection col, BasicDBObject query){
        long count = col.count(query);
        return count;
    }

    /**
     * Decorates a given Aggregation Pipeline with a "counter" stage at the end.
     */
    class CountThread extends Thread {

        int count;
        DBCollection col;
        private AggregationPipelineCounter counterPipeline;

        /**
         *
         * @param col
         * @param stages
         */
        public CountThread(DBCollection col, List<DBObject> stages) {
            counterPipeline = new AggregationPipelineCounter(stages);
            this.col    = col;
        }

        @Override
        public void run() {
            this.count = counterPipeline.execute(this.col);
        }

        /**
         * Gets the number of results.
         *
         * @return
         */
        public int getCount() {
            return count;
        }
    }
}
