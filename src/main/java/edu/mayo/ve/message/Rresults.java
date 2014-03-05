package edu.mayo.ve.message;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 6/24/13
 * Time: 8:41 PM
 * To change this template use File | Settings | File Templates.
 */
public class Rresults {
    Long totalResults = new Long(0);
    ArrayList<DBObject> results = new ArrayList<DBObject>();
    String mongoQuery = "";

    public void addResult(DBObject r){
        results.add(r);
    }

    public Long getNumberOfResults() {
        return totalResults;
    }

    public void setNumberOfResults(Long numberOfResults) {
        this.totalResults = numberOfResults;
    }

    public String getMongoQuery() {
        return mongoQuery;
    }

    public void setMongoQuery(String mongoQuery) {
        this.mongoQuery = mongoQuery;
    }
}
