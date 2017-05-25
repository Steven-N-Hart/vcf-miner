/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.WriteResult;
import java.io.IOException;
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
import edu.mayo.util.MongoConnection;
import java.net.UnknownHostException;
import java.util.Iterator;
import java.util.Set;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;


/**
 *
 * @author qvh
 */
@Path("/ve/workspace")
public class TabResource {
    
     Mongo m = MongoConnection.getMongo();
     
     /**
      * Given a Tab delimited file with a header line, read the file line by line and insert a record (document)
      * into the workspace for each row in the tab delimited file. (the file must fit in memory)
      * @param workspaceID
      * @return 
      */     
     @POST
     @Path("/tab/{workspaceid}")
     //@Consumes("text/plain")
     //@Consumes(MediaType.MULTIPART_FORM_DATA)
     @Produces("application/json")
     public String saveTabFile(@PathParam("workspaceid") String workspaceID, String tabFile) { //, String jsonString
         
         //System.out.println(tabFile);
         //System.out.println(workspaceID);
         String[] headers = null;
         DB db = MongoConnection.getDB();
         DBCollection coll = db.getCollection(workspaceID);
         String[] lines = tabFile.split("\n");
         boolean header_parsed = false;
         for(int i=0; i<lines.length; i++){
             if(lines[i].contains("------------------------------")){
                 //do nothing...
             }else if(lines[i].contains("Content-Disposition: form-data; name=")){
                 //do nothing...
             }else if(lines[i].contains("Content-Type: text/plain")){
                 //do nothing...
             }else if(!lines[i].contains("\t")){
                 //no tabs in line... don't worry about it 
             }else if(!header_parsed){
                 headers = lines[i].split("\t"); //the ontology terms on the first line
                 header_parsed = true;
                 for(int j=0; i< headers.length; i++){
                     headers[j] = headers[i].replaceAll(".", "<dot>");
                 }
             }else {                              
                 BasicDBObject bo = new BasicDBObject();
                 String[] cols = lines[i].split("\t");
                 for(int j = 0; j<cols.length; j++){
                     String v = cols[j].replaceAll("\\.", "<dot>");
                     v = v.replaceAll("\\$", "<dollar>");
                     bo.put(headers[j], v);
                     //System.out.println(headers[j] + " : " + v);
                 }
                 //System.out.println("Saving: " + lines[i]);
                 WriteResult save = coll.save(bo);
                 
             }
            
         }
         //BasicDBObject bo = (BasicDBObject) JSON.parse(jsonString);
         //WriteResult save = coll.save(bo);
        //System.out.println(workspaceID);
         BasicDBObject result = new BasicDBObject();
         result.put("status", "sucess");
         result.put("records_inserted", lines.length);
         return result.toString();
     }
     
    
}

