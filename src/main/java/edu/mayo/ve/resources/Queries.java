/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import javax.ws.rs.Path;

import com.mongodb.WriteResult;
import java.io.IOException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import com.mongodb.Mongo;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.DBCursor;
import com.mongodb.util.JSON;
import edu.mayo.ve.util.BottomCleaner;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.Tokens;
import java.net.UnknownHostException;
import java.util.Iterator;
import java.util.Set;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;
import org.bson.types.ObjectId;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;


/**
 *
 * @author Daniel Quest
 * This set of methods allows one to query the workspace using native mongo functionality
 */

@Path("/ve/q")
public class Queries {
     Mongo m = MongoConnection.getMongo();
     private static BottomCleaner bottomCleaner = new BottomCleaner();
     @GET
     @Path("/owner/list_workspaces/{user_id}")
     @Produces("application/json")
     public String getWorkspaceJSON(@PathParam("user_id") String userID) {
         bottomCleaner.dropWorkspacesWOMetadata(); //deal with a strange bug where some workspaces exist even after they are deleted... if this is too slow, consider spawning up a workerpool to do it in the background
         //System.out.println("getWorkspaceJSON: " + userID);
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);                   
         BasicDBObject query = new BasicDBObject();
         query.append(Tokens.OWNER, userID);
         DBCursor workspaces = coll.find(query);
         BasicDBObject docList = new BasicDBObject();
         int counter = 0;         
         while(workspaces.hasNext()){
                DBObject next = workspaces.next();
                //System.out.println(next.toString());
                docList.append(new Integer(counter).toString(), next);//next.get("_id"));
                counter++;
         }
         //System.err.println(docList.toString());
         return docList.toString() + "\n";
     }
     
     @GET
     @Path("/{workspace_id}/page/{num_results}")
     @Produces("application/json")
     public String getFirstNDocuments(@PathParam("workspace_id") String workspaceID, @PathParam("num_results") int num_results) {
         JsonObject ret = new JsonObject();
         JsonArray results = new JsonArray();
         //System.out.println("getWorkspaceJSON: " + userID);
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(workspaceID);                   
         BasicDBObject query = new BasicDBObject();

         DBCursor documents = coll.find(query);
         BasicDBObject docList = new BasicDBObject();
         int counter = 0; 
         JsonParser jparse = new JsonParser();
         while(documents.hasNext()){
                DBObject next = documents.next();
                JsonElement parse = jparse.parse(next.toString());
                results.add(parse);
                //System.out.println(next.toString());
                counter++;
                if(counter>num_results) break;
         }
         ret.add("results", results);
         //System.err.println(docList.toString());
         return ret.toString() + "\n";
     }
     
     
}
