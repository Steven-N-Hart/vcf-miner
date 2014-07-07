/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.SystemProperties;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.ErrorStats;
import edu.mayo.ve.VCFParser.VCFErrorFileUtils;

import javax.ws.rs.*;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;

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
        DB db = MongoConnection.getDB();
        DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject query = new BasicDBObject();
        BasicDBObject bo = (BasicDBObject) JSON.parse("{ "+key+" :\"" + id + "\" }"); //JSON2BasicDBObject
        DBCursor dbc = coll.find(bo);
        return dbc.next();
    }


    public void updateLoadStatistics(String workspace, HashMap<String, Integer> context) throws IOException {
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);

        //get the current object in the workspace:
        DBObject meta = queryMeta(Tokens.KEY, workspace);

        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspace);
//        BasicDBObject update = new BasicDBObject();
//
        DBObject stats = constructStatsObject(workspace, castContext(context));
        //place the stats object in the previous workspace metadata object
        meta.put("STATISTICS", stats);
        col.update(query,meta);
//
//        BasicDBObject bdbo = new BasicDBObject().append(Tokens.READY_TOKEN, readyStatus);
//        bdbo.append("status",message);
//        update.append("$set", bdbo);
//        coll.update(query, update);

//        System.out.println("workspace");
//        System.out.println(workspaceID);
//        System.out.println(coll.find(query).next().toString());

    }

    private HashMap<String,Long> castContext(HashMap<String, Integer> context){
        HashMap<String,Long> newContext = new HashMap<String,Long>();
        for(String key: context.keySet()){
            try {
                //System.out.println("key: " + key);
                //System.out.println("value: " + context.get(key));
                newContext.put(key, (long) context.get(key));
            }catch (Exception e){
                //don't care if we can't cast this thing... it is probably something like:
                // {$oid=53bb055c4206583ff3ec6f4b}
            }
        }
        return newContext;
    }

    /**
     * constructs a DBObject with statistics for the file that was loaded and statistics for the errors/warnings found in the file.
     * NOTE: This method can only be called once a VCF file is uploaded into the TEMPDIR (e.g. /tmp) with the error file next to it in
     * the same directory
     * @param workspace
     */
    public DBObject constructStatsObject(String workspace, HashMap<String,Long> context) throws IOException {
        String errorFile = VCFErrorFileUtils.getLoadErrorFilePath(workspace);
        ErrorStats estats = VCFErrorFileUtils.calculateErrorStatistics(errorFile);
        DBObject stats = new BasicDBObject();
        stats.put("ERRORS", (long) estats.getErrors());
        stats.put("WARNINGS", (long) estats.getWarnings());
        File f = new File(errorFile.replaceAll("\\.errors$",""));
        long filesize = 0;
        if(f.exists()){
            filesize = f.length();
        }
        stats.put("VCF_FILE_SIZE", filesize);
        for(String key : context.keySet()){
            stats.put(key, context.get(key));
        }
        return stats;
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
        DB db = MongoConnection.getDB();
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
     * If a workspace is flaged as ready, the ready token will have a value of 1 to indicate it is ready
     * do something like:
     * db.meta.update({"key": "wa49233e327247200efecf0c0968f8bc23aa3eb96"},{$set:{"ready":1}})
     *
     * for a given workspace, change the ready flag to ready (used by VCFParser and other loaders to tell when a workspace is indexed)
     * @param workspaceID
     */
    @POST
    @Path("/flagAsQueued/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsQueued(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is queued for loading", 2);
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
        DB db = MongoConnection.getDB();
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
        DB db = MongoConnection.getDB();
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

    /**
     *
     * @param workspaceID   - the workspace this metadata is for
     * @param message       - message (e.g. success, or a stack trace or whatever)
     * @param readyStatus   - e.g. 'failed'
     * @param numberLoaded  - number of lines loaded into the workspace
     * @param numberErrors  - number of lines that errored out
     * @param errorExamples - examples of lines that failed (up to 10)
     * @return
     */
    public String flag(String workspaceID, String message, int readyStatus, int numberLoaded, int numberErrors, List<String> errorExamples) {
        return "{\"status\":\""+message+"\", \"key\":"+workspaceID+"}";
    }
    
}
