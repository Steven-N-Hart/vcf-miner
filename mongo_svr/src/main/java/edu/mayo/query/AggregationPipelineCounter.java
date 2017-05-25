package edu.mayo.query;

import com.mongodb.AggregationOutput;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Decorates a given Aggregation Pipeline by adding a final stage that counts the documents.
 */
public class AggregationPipelineCounter {

    private static final String COUNT_FIELD = "count";
    private List<DBObject> stages;

    /**
     * Constructor
     *
     * @param stages Aggregation Pipeline stages
     */
    public AggregationPipelineCounter(List<DBObject> stages) {
        this.stages = stages;
    }

    /**
     * Executes the counter pipeline on the specified collection.
     *
     * @param col The collection to be pressed by the pipeline.
     * @return The count that passes the pipeline.
     */
    public int execute(DBCollection col) {
        long start = System.currentTimeMillis();

        List<DBObject> countPipeline = new ArrayList<DBObject>();
        countPipeline.addAll(stages);

        // add additional stage to count
        BasicDBObject groupArgs = new BasicDBObject();
        groupArgs.append("_id", null);
        groupArgs.append(COUNT_FIELD, new BasicDBObject("$sum", 1));
        DBObject groupStage = new BasicDBObject("$group", groupArgs);

        countPipeline.add(groupStage);

        System.out.println("COUNT PIPELINE: " + countPipeline.toString());

        AggregationOutput output = col.aggregate(countPipeline);

        int count = -1;
        Iterator<DBObject> resultItr = output.results().iterator();
        while (resultItr.hasNext()) {
            DBObject result = resultItr.next();
            if (result.containsField(COUNT_FIELD)) {
                count = (Integer)result.get(COUNT_FIELD);
            }
        }

        long elapsed = System.currentTimeMillis() - start;
        System.out.println("Aggregation Pipeline Count took: " + elapsed);

        return count;
    }
}
