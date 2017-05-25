package edu.mayo.query;

import com.mongodb.*;
import edu.mayo.ve.message.Querry;

import java.util.List;

/**
 * Created by m102417 on 5/26/15.
 */
public class AggregationQueryCursor implements QueryCursorInterface {
    DBCollection col;
    Querry query;
    List<DBObject> stages;
    Cursor cursor;

    private long count;

    public AggregationQueryCursor(DBCollection col, Querry q) throws InterruptedException {
        this.col = col;
        this.query = q;
        setup();
    }

    public void setup() throws InterruptedException {
        // construct a pipeline of stages
        stages = QueryBuilder.buildAggregationPipeline(query);

        // prior to adding a $limit stage, lets get the total count of ALL variants that pass
        // get count in separate thread
        CountThread countThread = new CountThread(col, stages);
        countThread.start();
        // wait for separate thread to finish
        countThread.join();
        count = ((long) countThread.getCount());

        // now add the $limit stage to limit number of results to what the user/client specified
        stages.add(new BasicDBObject("$limit", query.getNumberResults()));

        // run aggregation pipeline that returns a cursor to the result collection
        AggregationOptions aggregationOptions = AggregationOptions.builder()
                .outputMode(AggregationOptions.OutputMode.CURSOR)
                .build();
        cursor = col.aggregate(stages, aggregationOptions);
    }


    @Override
    public boolean hasNext() {
        return cursor.hasNext();
    }

    @Override
    public DBObject next() {
        return cursor.next();
    }

    @Override
    public Long countResults() {
        return count;
    }

    @Override
    public void reset() throws InterruptedException {
        setup();
    }

    @Override
    public DBCollection getCol() {
        return col;
    }

    @Override
    public void setCol(DBCollection col) {
        this.col = col;
    }

    public String getQuery(){
        return stages.toString();
    }

    @Override
    public void setQuery(Querry query) {
        this.query = query;
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
