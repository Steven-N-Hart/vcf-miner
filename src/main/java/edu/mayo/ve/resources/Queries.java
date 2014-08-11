/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.*;
import edu.mayo.securityuserapp.client.SessionExpiredClientException;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.SystemProperties;
import edu.mayo.util.Tokens;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.util.BottomCleaner;

import javax.ws.rs.*;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.Set;


/**
 *
 * @author Daniel Quest
 * This set of methods allows one to query the workspace using native mongo functionality
 */

@Path("/ve/q")
public class Queries {

    private SecurityUserAppHelper securityHelper;

    public Queries() throws IOException {
        securityHelper = new SecurityUserAppHelper(new SystemProperties());
    }

     Mongo m = MongoConnection.getMongo();
     private static BottomCleaner bottomCleaner = new BottomCleaner();
     @GET
     @Path("/owner/list_workspaces/{user_id}")
     @Produces("application/json")
     public String getWorkspaceJSON(@PathParam("user_id") String userID, @HeaderParam("usertoken") String userToken) throws Exception {

         Set<String> authKeys;
         try {
            authKeys = securityHelper.getAuthorizedWorkspaces(userToken);
         } catch (SessionExpiredClientException sece) {
             // translate expired session to UNAUTHORIZED - 401
             throw new WebApplicationException(Response.Status.UNAUTHORIZED);
         }


         // build IN clause using authorized keys
         BasicDBList inList = new BasicDBList();
         for(String key : authKeys){
             inList.add(key);
         }
         BasicDBObject inClause = new BasicDBObject();
         inClause.put("$in", inList);

         bottomCleaner.dropWorkspacesWOMetadata(); //deal with a strange bug where some workspaces exist even after they are deleted... if this is too slow, consider spawning up a workerpool to do it in the background
         //System.out.println("getWorkspaceJSON: " + userID);
         DB db = MongoConnection.getDB();
         DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);
         BasicDBObject query = new BasicDBObject();
         query.put("key", inClause);
         DBCursor workspaces = coll.find(query);
         BasicDBObject docList = new BasicDBObject();
         int counter = 0;         
         while(workspaces.hasNext()){
                DBObject next = workspaces.next();
                //System.out.println(next.toString());
             String key = (String) next.get(Tokens.KEY);

             if (authKeys.contains(key)) {
                 docList.append(new Integer(counter).toString(), next);//next.get("_id"));
                 counter++;
             }
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
         DB db = MongoConnection.getDB();
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
