package edu.mayo.query;

import com.mongodb.*;
import edu.mayo.ve.message.Querry;

/**
 * Created by m102417 on 5/22/15.
 *
 * A Querry factory takes a querry object and returns back a cursor
 * That is used to itterate over the dataset.
 *
 * The factory is built because cursor objects are not equal and aggregation pipleines return
 * a slightly different cursor than db.find() searches.
 *
 */
public class QueryFactory {

    public QueryFactory(){

    }

    public QueryCursorInterface makeCursor(DBCollection col, Querry q) throws InterruptedException {
        if (q.getSampleGroups().size() >= 1) {
            return new AggregationQueryCursor(col, q);
        }else {
            return new StandardQueryCursor(col,q);
        }
    }
}
