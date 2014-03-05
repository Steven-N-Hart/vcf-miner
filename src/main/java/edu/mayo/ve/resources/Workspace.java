/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

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
import edu.mayo.ve.util.FixStrings;
import edu.mayo.ve.util.MongoConnection;
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
 * @author qvh
 */
@Path("/ve")
public class Workspace {
    
     Mongo m = MongoConnection.getMongo();
     
     /**
      * save a document to the workspace provided
      * @param workspaceID
      * @return 
      */     
     @PUT
     @Path("/document/{workspaceid}")
     //@Consumes("application/json")
     @Produces("application/json")
     public String saveDocument(@PathParam("workspaceid") String workspaceID, String jsonString) { //, String jsonString
         //System.out.println(jsonString);
         //System.out.println(workspaceID);
         //System.out.println(jsonString);
         jsonString = FixStrings.usr2mongo(jsonString);
         System.out.println(jsonString);
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(workspaceID);
         BasicDBObject bo = (BasicDBObject) JSON.parse(jsonString);
         WriteResult save = coll.save(bo);
        //System.out.println(workspaceID);
         return FixStrings.mongo2usr(bo.toString()) + "\n";
     }
     
     /**
      * save a document to the workspace provided
      * @param workspaceID
      * @return 
      */     
     @POST
     @Path("/document/{workspaceid}")
     //@Consumes("application/json")
     @Produces("application/json")
     public String saveJSONDocument(@PathParam("workspaceid") String workspaceID, String jsonString) { //, String jsonString
         //System.out.println(jsonString);
         //System.out.println(workspaceID);
         //System.out.println(jsonString);
         jsonString = FixStrings.usr2mongo(jsonString);
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(workspaceID);
         BasicDBObject bo = (BasicDBObject) JSON.parse(jsonString);
         WriteResult save = coll.save(bo);
         BasicDBObject ret = new BasicDBObject();
         ret.append("status", "saved document to workspace= " + workspaceID);
         ret.append("_id", "\"" + bo.get("_id").toString() + "\""); 
        //System.out.println(workspaceID);
         return FixStrings.mongo2usr(bo.toString()) + "\n";
     }
     
     @DELETE
     @Path("/delete_workspace/{workspaceid}")
     @Produces("application/json")
     public String deleteWorkspace(@PathParam("workspaceid") String workspaceID){
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         //first delete the data in the workspace
         DBCollection coll = db.getCollection(workspaceID);
         coll.dropIndexes(); //drop all indexes on the workspace
         coll.drop();        //delete all data in the workspace
         //meta
         DBCollection colmeta =  db.getCollection(Tokens.METADATA_COLLECTION);
         BasicDBObject meta = new BasicDBObject();
         meta.put(Tokens.KEY, workspaceID);
         colmeta.remove(meta);
         //remove sampleGroups for this workspace
         DBCollection sgcol =  db.getCollection(Tokens.SAMPLE_GROUP_COLLECTION);
         BasicDBObject sg = new BasicDBObject();
         sg.put(Tokens.KEY, workspaceID);
         sgcol.remove(sg);
         //remove typeahead
         DBCollection tacol =  db.getCollection(Tokens.TYPEAHEAD_COLLECTION);
         BasicDBObject ta = new BasicDBObject();
         ta.put(Tokens.KEY, workspaceID);
         tacol.remove(ta);
         //return the status of the deletion to the caller
         BasicDBObject bo = new BasicDBObject();
         bo.append("status", "workspace= " + workspaceID + " deleted");
         return bo.toString()+"\n"; 
     }
   
     @DELETE 
     @Path("/delete/{workspaceid}/document/{documentid}")
     @Produces("application/json")
     public String deleteDocument(@PathParam("workspaceid") String workspaceID, @PathParam("documentid") String documentID){        
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(workspaceID);
         DBObject deleteme = findbyIDquery(coll, documentID);
         coll.remove(deleteme);
         BasicDBObject bo = new BasicDBObject();
         bo.append("status", "document= " + workspaceID + " deleted");
         //System.out.println(bo.toString());
         return bo.toString(); 
     }
     
     public DBObject findbyIDquery(DBCollection coll, String docid){
         //use something like {_id:ObjectId("4f4feac16970c538d322f61d")} inside of findOne()
        DBObject searchById = new BasicDBObject("_id", new ObjectId(docid));
        return coll.findOne(searchById);
     }
     
     @GET
     @Path("/document/find/{workspaceid}")
     @Consumes("application/json")
     @Produces("application/json")
     public String findDocumentONGet(@PathParam("workspaceid") String workspaceID){
         return findDocument(workspaceID, "");
     }
     
     /**
      * save a document to the workspace provided
      * @param workspaceID
      * @return 
      */     
     @POST
     @Path("/document/find/{workspaceid}")
     @Consumes("application/json")
     @Produces("application/json")
     public String findDocument(@PathParam("workspaceid") String workspaceID, String jsonString) { //, String jsonString
         if(jsonString.contains("$")){          
             return parseJSONFind(workspaceID, jsonString);
         }
         else {
            return parseJSONFind(workspaceID, jsonString);
         }
     }
     
     public String parseJSONFind(String workspaceID, String jsonString){
         StringBuffer ret = new StringBuffer();
         ret.append("{\n");
         System.out.println(workspaceID);
         System.out.println(jsonString);
         int counter = 0;
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(workspaceID);
         BasicDBObject query = (BasicDBObject) JSON.parse(jsonString); //FixStrings.usr2mongo(jsonString)
         System.out.println("query: " + query.toString());
         DBCursor find = coll.find(query);
         Iterator<DBObject> iter = find.iterator();
         while(iter.hasNext()){
             counter++;
             if(counter > 1) ret.append(",\n");
             DBObject next = iter.next();
             Map toMap = next.toMap();
             ret.append("\"" + toMap.get("_id").toString() + "\" : ");
             //remove the redundant id
             next.removeField("_id"); 
             //ret+= "\"kbid" + counter + "\" : "; 
             String rec = FixStrings.mongo2usr(next.toString());
             ret.append(rec);
         }
         ret.append("\n}\n");
        //System.out.println(workspaceID);
         return ret.toString();
         
     }
     
     @GET
     @Path("/documents/{workspaceid}")
     @Produces("application/json")
     public JSONObject getDocIDs(@PathParam("workspaceid") String workspaceID) {
         
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         
         DBCollection coll = db.getCollection(workspaceID);
         DBCursor documents = coll.find();
         JSONObject docList = new JSONObject();
         int counter = 0;
         try {
             while(documents.hasNext()){
                    DBObject next = documents.next();
                    //System.out.println(next.get("_id"));
                    docList.put(new Integer(counter).toString(), next.get("_id"));
                    counter++;
             }
         } catch (JSONException ex) {
            Logger.getLogger(Workspace.class.getName()).log(Level.SEVERE, null, ex);
         }
         //System.err.println(workspaceID);
         return docList;
     }
     
//     //ps/store/<key> 
//     @PUT
//     @Path("/store/{workspaceid}")
//     @Produces("application/json")
//     @Consumes("application/json")
//     public JSONObject storeDocument( String message, @PathParam("workspaceid") String workspaceID){
//         DBCollection coll = db.getCollection(workspaceID);
//         BasicDBObject bo = (BasicDBObject) JSON.parse(message);
//         WriteResult save = coll.save(bo);
//         JSONObject response = new JSONObject();
//         try {
//             System.out.println(workspaceID);
//             System.out.println(message);
//             response.put("status", "success");
//             response.put("mongoresponse", save.toString());
//             response.put("content", message);
//         } catch (JSONException ex) {
//            Logger.getLogger(Workspace.class.getName()).log(Level.SEVERE, null, ex);
//         }
//         return response;
//     }
    
}

