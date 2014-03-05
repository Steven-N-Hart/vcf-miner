package edu.mayo.ve.resources;

import com.google.gson.Gson;
import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.ve.message.FilterHistory;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.util.HashUtil;
import edu.mayo.ve.util.MongoConnection;
import edu.mayo.ve.util.Tokens;
import org.bson.types.ObjectId;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.io.UnsupportedEncodingException;
import java.security.NoSuchAlgorithmException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 *
 * History refers to the session history, this class allows users to save session histories to Mongo
 *
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 10/9/13
 * Time: 2:27 PM
 * To change this template use File | Settings | File Templates.
 */
@Path("/ve/filterHistory/")
public class History {
    Mongo m = MongoConnection.getMongo();
    Gson gson = new Gson();


    public String timestamp(){
        DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        Date date = new Date();
        return dateFormat.format(date);
    }

    //CRUD
    //create
    @Path("save/")
    @POST
    @Produces("application/json")
    @Consumes(MediaType.APPLICATION_JSON)
    public String save(FilterHistory filterHistory) throws UnsupportedEncodingException, NoSuchAlgorithmException {
        //populate timestamp
        filterHistory.setTimestamp(timestamp());
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.FILTER_HISTORY_COLLECTION);
        String json = gson.toJson(filterHistory);
        BasicDBObject dbo = (BasicDBObject) JSON.parse(json);

        //get a unique value and push it into the id field
        WriteResult wr = col.save(dbo);
        ObjectId id = dbo.getObjectId("_id");
        //System.out.println("ID: " + id.toString());
        String key = "f" + HashUtil.SHA1(HashUtil.randcat(id.toString())); //we need to add w so we don't get keys that are invalid such as 7foobar
        //System.out.println("ID: " + key);
        dbo.put("id", key);
        BasicDBObject query = new BasicDBObject(); query.put("_id", id);
        col.update(query, dbo);

        return "{\"filterHistorySaved\":1}\n";
    }

    //CRUD
    //retrieve - based on workspaceID

    /**
     * given a workspace id, return a list of all filterHistory objects stored on that
     * workspace
     * @param workspaceID
     * @return
     */
    @GET
    @Path("search/w/{workspaceID}/")
    @Produces("application/json")
    public String get(@PathParam("workspaceID") String workspaceID){
        List<DBObject> ret = new ArrayList<DBObject>();
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.FILTER_HISTORY_COLLECTION);
        BasicDBObject dbo = new BasicDBObject();
        dbo.put(Tokens.KEY, workspaceID);
        DBCursor cursor = col.find(dbo);
        while(cursor.hasNext()){
            DBObject next = cursor.next();
            //ObjectId id = (ObjectId) next.get("_id");
            //next.put("id", id.toString());
            //next.removeField("_id");
            ret.add(next);
        }
        StringBuilder sb = new StringBuilder();
        sb.append("{ filterHistories : ");
        sb.append(gson.toJson(ret));
        sb.append(" }");
        return sb.toString();
    }



    //CRUD
    //delete
    @DELETE
    @Path("/delete/{fileHistoryID}/")
    @Produces("application/json")
    public String delete(@PathParam("fileHistoryID") String fileHistoryID){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.FILTER_HISTORY_COLLECTION);
        BasicDBObject del = new BasicDBObject();
        del.put("id",fileHistoryID);
        System.out.println(del.toString());
        WriteResult remove = col.remove(del);
        return "{\"fileHistoryID\" : " + fileHistoryID + "\"status\" : " + remove.toString() + "}";
    }
}
