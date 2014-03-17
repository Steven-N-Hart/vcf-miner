package edu.mayo.ve.resources;

import com.google.gson.Gson;
import com.mongodb.*;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.Rresults;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.Tokens;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

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

    @POST
    @Produces("application/json")
    @Consumes(MediaType.APPLICATION_JSON)
    public String handleBasicQuerry(Querry q){
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
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

        return gson.toJson(results);
    }


    public Long countResults(DBCollection col, BasicDBObject query){
        long count = col.count(query);
        return count;
    }
}
