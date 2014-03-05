/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.ve.util.MongoConnection;
import edu.mayo.ve.util.Tokens;

import javax.ws.rs.*;

/**
 *
 * @author m102417
 * Given a workspaceID or an alias, respond with the metadata for the  workspace (collection)
 */
@Path("/ve/meta")
public class MetaData {
    Mongo m = MongoConnection.getMongo();
    
     @GET
     @Path("/alias/{alias_id}")
     @Produces("application/json")
     public String getWorkspaceJSONfromAlias(@PathParam("alias_id") String alias) {
        return queryMetaString("alias", alias);
     }
     
     /**
      * given a workspaceID - return all metadata about that workspace.
      * @param workspaceID
      * @return 
      */
     @GET
     @Path("/workspace/{workspaceid}")
     @Produces("application/json")
     public String getWorkspaceJSON(@PathParam("workspaceid") String workspaceID) {
         return queryMetaString(Tokens.KEY, workspaceID);
     }
     
     public String queryMetaString(String key, String id){
         return queryMeta(key, id).toString() + "\n"; //need to catch exceptions and so on...
     }

    public DBObject queryMeta(String key, String id){
        //System.out.println("key: " + key + " : " + "id: " + id );
        BasicDBObject dbo = new BasicDBObject();
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
        DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject query = new BasicDBObject();
        BasicDBObject bo = (BasicDBObject) JSON.parse("{ "+key+" :\"" + id + "\" }"); //JSON2BasicDBObject
        DBCursor dbc = coll.find(bo);
        return dbc.next();
    }


    /**
     * inspects the ready tag of a workspace and returns ready=1 if the workspace is ready or ready=0 if not
     */
    @GET
    @Path("/isReady/w/{workspaceid}")
    @Produces("application/json")
    public String isReady(@PathParam("workspaceid") String workspaceID) {
        BasicDBObject ret = new BasicDBObject();
        ret.put(Tokens.READY_TOKEN, 0);
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
        DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject query = new BasicDBObject();
        query.put(Tokens.KEY,workspaceID);
        DBCursor cursor = coll.find(query);
        if(cursor.hasNext()){
            Integer ready = (Integer) cursor.next().get(Tokens.READY_TOKEN);
            if(ready == null){
                ret.put(Tokens.READY_TOKEN, 0);
                return ret.toString();
            }else if(ready == 1){
                ret.put(Tokens.READY_TOKEN, 1);
                return ret.toString();
            }else {
                ret.put(Tokens.READY_TOKEN, 0);
                return ret.toString();
            }
        }
        ret.put("ERROR", 1);
        ret.put("NO_WORKSPACE",1);
        ret.put(Tokens.KEY, workspaceID);
        return ret.toString();
    }

    /**
     * If a workspace is flaged as ready, the ready token will have a value of 1 to indicate it is ready
     * do something like:
     * db.meta.update({"key": "wa49233e327247200efecf0c0968f8bc23aa3eb96"},{$set:{"ready":1}})
     *
     * for a given workspace, change the ready flag to ready (used by VCFParser and other loaders to tell when a workspace is indexed)
     * @param workspaceID
     */
    @POST
    @Path("/flagAsReady/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsReady(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is ready", 1);
    }


    /**
     * If a workspace is flaged as not ready, the ready token will have a value of 0 to indicate it is not ready
     * do something like:
     * db.meta.update({"key": "wa49233e327247200efecf0c0968f8bc23aa3eb96"},{$set:{"ready":0}})
     *
     * @param workspaceID
     */
    @POST
    @Path("/flagAsNotReady/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsNotReady(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is not ready", 0);
    }

    /**
     * Given an alias, flag all workspaces that have that alias as failed (more a utility function for administrators who need to fail out a bunch of loads)
     * @param alias
     * @param failMessage
     * @return
     */
    @POST
    @Path("/flagAsFailed/a/{alias}/m/{failMessage}")
    @Produces("application/json")
    public String flagAllAliasAsFailed(
            @PathParam("alias") String alias,
            @PathParam("failMessage") String failMessage){
        DBObject ret = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        //return flag(workspaceID, failMessage, -1);

        //get all of the
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
        DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject query = new BasicDBObject();
        query.append("alias", alias);
        DBCursor cursor = coll.find(query);
        while(cursor.hasNext()){
            DBObject next = cursor.next();
            String key =(String) next.get("key");
            l.add(key);
            flag(key, failMessage, -1);
        }
        ret.put("workspacesFlagedAsFailed", l);

        return ret.toString();
    }

    /**
     * If a workspace is flagged as failed, then it will get a -1 value for the ready state in the metadata
     * @param workspaceID - key for the workspace
     * @param failMessage - the message we want to place in the metadata for the failure
     * @return
     */
    @POST
    @Path("/flagAsFailed/w/{workspaceid}/m/{failMessage}")
    @Produces("application/json")
    public String flagAsFailed(@PathParam("workspaceid") String workspaceID, @PathParam("failMessage") String failMessage){
        return flag(workspaceID, failMessage, -1);
    }

    private String flag(String workspaceID, String message, int readyStatus){
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
        DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);

        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspaceID);
        BasicDBObject update = new BasicDBObject();
        BasicDBObject bdbo = new BasicDBObject().append(Tokens.READY_TOKEN, readyStatus);
        bdbo.append("status",message);
        update.append("$set", bdbo);
        coll.update(query, update);

//        System.out.println("workspace");
//        System.out.println(workspaceID);
//        System.out.println(coll.find(query).next().toString());

        return "{\"status\":\""+message+"\", \"key\":"+workspaceID+"}";

    }
    
}
