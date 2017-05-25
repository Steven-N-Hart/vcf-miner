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

    public static final int STATUS_FAILED    = -1;
    public static final int STATUS_READY     = 1;
    public static final int STATUS_QUEUED    = 2;
    public static final int STATUS_IMPORTING = 3;
    public static final int STATUS_INDEXING  = 4;
    public static final int STATUS_ANNOTATING  = 5;

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

    public void updateInfoField(String key, String newField, int number, String type, String description){
        //make it robust to calls with INFO. on them and those without...
        String prefix = "INFO.";
        if(newField.startsWith(prefix)){
            prefix = "";
        }
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject newobj = new BasicDBObject();
        newobj.append("number", number);
        newobj.append("type", type);
        newobj.append("Description", description);
        newobj.append("EntryType","INFO");
        BasicDBObject updateQuery = new BasicDBObject();
        updateQuery.append("$set", new BasicDBObject().append("HEADER." + prefix + newField, newobj));
        col.update(new BasicDBObject().append("key", key), updateQuery);
    }

    /**
     *
     * @param key - the workspace key
     * @param field - the field we want to check if it exists
     * @return
     */
    public boolean checkFieldExists(String key, String field){
        String[] tokens = field.split("\\.");
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject query = new BasicDBObject();
        query.put("key",key);
        DBCursor c = col.find(query);
        boolean isKeyFound = false;
        if(c.hasNext()){
            DBObject next = c.next();
            int i=0;
            do {
            	next = (DBObject) next.get(tokens[i++]);
            } while( i < tokens.length  &&  next != null );
            isKeyFound = next != null;
        }
        return isKeyFound;
    }


    public boolean checkINFOFieldExists(String key, String field){
        return checkFieldExists(key, "HEADER.INFO." + field);
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

    /**
     * Updates statistics for errors/warnings.
     * @param workspace
     * @throws IOException
     */
    public void updateErrorsAndWarningCounts(String workspace) throws IOException {
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);

        ErrorStats estats = VCFErrorFileUtils.calculateErrorStatistics(workspace);
//        BasicDBObject stats = new BasicDBObject();
//        stats.append("$set", new BasicDBObject().append("ERRORS",   (long) estats.getErrors()));
//        stats.append("$set", new BasicDBObject().append("WARNINGS", (long) estats.getWarnings()));

        //get the current object in the workspace:
        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspace);
        col.update(query, (DBObject) JSON.parse(String.format("{ '$set' : { 'STATISTICS.ERRORS': %s}}", estats.getErrors())));
        col.update(query, (DBObject) JSON.parse(String.format("{ '$set' : { 'STATISTICS.WARNINGS': %s}}", estats.getWarnings())));
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
     * constructs a DBObject with statistics for the file that was loaded.
     * NOTE: This method can only be called once a VCF file is uploaded into the TEMPDIR (e.g. /tmp) with the error file next to it in
     * the same directory
     * @param workspace
     */
    public DBObject constructStatsObject(String workspace, HashMap<String,Long> context) throws IOException {
        DBObject stats = new BasicDBObject();
        String errorFile = VCFErrorFileUtils.getLoadErrorFilePath(workspace);
        File f = new File(errorFile.replaceAll("\\.errors$",""));
        long filesize = 0;
        if(f.exists()){
            filesize = f.length();
        }
        stats.put("VCF_FILE_SIZE", filesize);
        for(String key : context.keySet()){
            stats.put(key, context.get(key));
        }
        ErrorStats estats = VCFErrorFileUtils.calculateErrorStatistics(workspace);
        stats.put("ERRORS",   (long) estats.getErrors());
        stats.put("WARNINGS", (long) estats.getWarnings());

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
     * Workspace ready token will have a value of {@link MetaData#STATUS_READY}.
     */
    @POST
    @Path("/flagAsReady/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsReady(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is ready", STATUS_READY);
    }

    /**
     * Workspace ready token will have a value of {@link MetaData#STATUS_QUEUED}.
     */
    @POST
    @Path("/flagAsQueued/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsQueued(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is queued for loading", STATUS_QUEUED);
    }

    /**
     * Workspace ready token will have a value of {@link MetaData#STATUS_IMPORTING}.
     */
    @POST
    @Path("/flagAsImporting/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsImporting(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is importing", STATUS_IMPORTING);
    }

    /**
     * Workspace ready token will have a value of {@link MetaData#STATUS_INDEXING}.
     */
    @POST
    @Path("/flagAsIndexing/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsIndexing(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is indexing", STATUS_INDEXING);
    }

    /**
     * Workspace ready token will have a value of {@link MetaData#STATUS_INDEXING}.
     */
    @POST
    @Path("/flagAsAnnotating/w/{workspaceid}")
    @Produces("application/json")
    public String flagAsAnnotating(@PathParam("workspaceid") String workspaceID){
        return flag(workspaceID, "workspace is annotating", STATUS_ANNOTATING);
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
            flag(key, failMessage, STATUS_FAILED);
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
        return flag(workspaceID, failMessage, STATUS_FAILED);
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
