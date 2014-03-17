/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.ve.message.SampleGroup;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.Tokens;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author m102417
 * operations on samples such as count the number of samples that satisfy a criteria
 * and return the samples that satisfy a criteria.
 */
@Path("/ve/samples")
public class Samples {
    
     Mongo m = MongoConnection.getMongo();
     MetaData meta = new MetaData();
     /**
      * Exec a Query of the Following Form:
      * > db.w3f5176b533587a4a6e11c7b03d8b74f47895e5c5.find({"samples.maxAD":{$gt:450}}).count()
      * This will count the number of variants that pass
      * @param workspace - the workspace/collection to execute the query on
      * @param field - the field you want compared (e.g. AD, PL, ect)
      * @param comparitor supported values eq =, gt >, lt < 
      * http://docs.mongodb.org/manual/reference/operator/
      * @param value the value used in the compairison
      * @return 
      */
     @GET
     @Path("/count/w/{workspace_id}/f/{field}/{comparitor}/{value}")
     @Produces("application/json")
     public String countSamples(@PathParam("workspace_id") String workspace, 
                                @PathParam("field") String field,
                                @PathParam("comparitor") String comparitor,
                                @PathParam("value") String value
        ) {
         BasicDBObject dbo = new BasicDBObject(); 
         DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         DBCollection coll = db.getCollection(workspace);
         BasicDBObject query = (BasicDBObject) JSON.parse(cJSON(field, comparitor, value)); //JSON2BasicDBObject
         long count = coll.getCount(query);
         return "{\"count\":"+count+"}\n";     
     }
     
     private String cJSON(String field, String comparitor, String value){
         if(comparitor.equalsIgnoreCase("eq")){
             return "{\""+field+"\":"+value+"}";
         }
         else if(comparitor.equalsIgnoreCase("gt")){
             String s = "{$gt:"+value+"}";
             return "{\""+field+"\":"+s+"}";
         }
         else if(comparitor.equalsIgnoreCase("lt")){
             String s = "{$lt:"+value+"}";
             return "{\""+field+"\":"+s+"}";
         }
         return "{}";
     }
     
     /**
      * 
      * Exec a Query of the Following Form:
      * > db.w3f5176b533587a4a6e11c7b03d8b74f47895e5c5.find({"samples.maxAD":{$gt:450}})
      * @param workspace - the workspace/collection to execute the query on
      * @param field - the field you want compared (e.g. AD, PL, ect)
      * @param comparitor supported values eq =, gt >, lt < 
      * http://docs.mongodb.org/manual/reference/operator/
      * @param value the value used in the compairison
      * @return a JSON array of the sampleIDs that pass a given criteria
      */
     @GET
     @Path("/w/{workspace_id}/f/{field}/{comparitor}/{value}")
     @Produces("application/json")
     public String getSamplesSatisfyingCondition(@PathParam("workspace_id") String workspace, 
                                @PathParam("field") String field,
                                @PathParam("comparitor") String comparitor,
                                @PathParam("value") String value
        ) {
         String workspaceJSON = meta.getWorkspaceJSON(workspace);
         //BasicDBObject dbo = new BasicDBObject(); 
         //DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
         //DBCollection coll = db.getCollection(workspace);
         //BasicDBObject query = (BasicDBObject) JSON.parse(cJSON(field, comparitor, value)); //JSON2BasicDBObject
         //DBCursor find = coll.find(query);
         return workspaceJSON;     
     }


    /**
     *  given a workspace - then return back all groups in the collection for that workspace
     */
    @GET
    @Path("/groups/w/{workspace_id}/")
    @Produces("application/json")
    public String getGroupsForWorkspace(@PathParam("workspace_id") String workspace){
        BasicDBObject ret = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.SAMPLE_GROUP_COLLECTION);
        BasicDBObject q = new BasicDBObject();
        q.put(Tokens.KEY,workspace);
        DBCursor dbObjects = col.find(q);
        for(DBObject dbo : dbObjects){
             l.add(dbo);
        }
        ret.put("sampleGroups", l);
        return ret.toString();
    }

    /**
     *   Save a new sample group to mongo
     *   @param group - the thing we want to save - a group of strings with an alias
     */
    @POST
    @Path("/savegroup")
    @Produces("application/json")
    @Consumes(MediaType.APPLICATION_JSON)
    public String saveGroupsToWorkspace(SampleGroup group){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.SAMPLE_GROUP_COLLECTION);
        BasicDBObject q = group.getBasicDBObject();
        WriteResult wr = col.insert(q);
        return "{\"result\":\"" + wr.toString() + "\"}";
    }

    @POST
    @Path("/deletegroup")
    @Produces("application/json")
    @Consumes(MediaType.APPLICATION_JSON)
    public String deleteGroup(SampleGroup group){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.SAMPLE_GROUP_COLLECTION);
        BasicDBObject q = group.getBasicDBObject();
        WriteResult wr = col.remove(q);
        return "{\"result\":\"" + wr.toString() + "\"}";
    }
    
}
