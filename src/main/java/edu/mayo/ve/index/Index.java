/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.index;

import com.mongodb.*;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.Tokens;

import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author m102417
 */
public class Index {
    Mongo m = MongoConnection.getMongo();
    public final int maxIndexesPerCollection = 64; //mongoDB hard limit
    
    /**
     * 
     * @param jsonPath - the jsonPath to index
     */
    public void Index(String collection, String jsonPath){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(collection);
        BasicDBObject query = new BasicDBObject();
        
        col.ensureIndex(query);
    }

    /**
     * This differs from the index function in that it takes a DBCollection and returns a message
     * @param field
     * @param col
     * @return
     */
    public DBObject indexField(String field, DBCollection col){
        BasicDBObject message = new BasicDBObject();
        if(hasIndex(col, "key", field)){
            message.put("status",field + " already indexed");
            return message;
        } else if(countIndexes4Collection(col) >= maxIndexesPerCollection -1 ){
            message.put("status",field + " can not be indexed, there are no more index spaces left in MongoDB! ");
            return message;
        } else {
            BasicDBObject dbo = new BasicDBObject();
            dbo.put(field,1);
            col.ensureIndex(dbo);
            message.put("status",field + " indexed successfully");
            return message;
        }
    }

    public DBObject dropIndexField(String field, DBCollection col){
        BasicDBObject message = new BasicDBObject();
        try {
            col.dropIndex(field);
            message.put("status",field + " index dropped");
            return message;
        }catch(Exception e){
            try{
                col.dropIndex(field+"_1");
                message.put("status",field + " index dropped");
                return message;

            }catch(Exception e2){
                message.put("status",field + " index drop failed");
                return message;
            }
        }
    }

    public int countIndexes4Collection(DBCollection col){
        return  getIndexedFieldsAsStrings(col, false).size();
    }


    public final String fieldToken = "fields";

    /**
     * return a list of strings representing indexed fields in the database
     * e.g.
     *      INFO.SNPEFF_EFFECT,  ..., FORMAT.min.PL, ... (removeLeadingToken == false)
     * OR
     *      SNPEFF_EFFECT,  ..., min.PL, ...   (removeLeadingToken == true)
     *
     * @param col                      - the collection/workspace
     * @param removeLeadingToken  true - remove the token pre-pending the field, false leave it
     * @return
     */
    public List<String> getIndexedFieldsAsStrings(DBCollection col, boolean removeLeadingToken){
        ArrayList<String> fields = new ArrayList<String>();
        DBObject message = getIndexedFields(col);
        BasicDBList fmeta = (BasicDBList) message.get(fieldToken);
        if(fmeta != null){
            for(String key : fmeta.keySet()){
                DBObject o = (DBObject) fmeta.get(key);
                String field = getField(o);
                if(field != null){
                    int loc = field.indexOf(".");
                    if(removeLeadingToken && loc > 0){
                        String tmp = field.substring(loc+1,field.length());
                        //System.out.println(tmp);
                        fields.add(tmp);
                    }else {
                        fields.add(field);
                    }
                }
            }
        }
        return fields;
    }

    /**
     * given : { "v" : 1, "key" : { "ADIntervalMin" : 1 }, "ns" : "workspace.wf0b02ae8a9724b95127e25453f0fd81e28b82971", "name" : "ADIntervalMin_1" }
     * as a DBObject
     * @param dbo
     * @return  name of the field that is indexed e.g. ADIntervalMin -- null if could not get field!
     */
    public String getField(DBObject dbo){
        String field = null;
        if(dbo != null){
            DBObject o = (DBObject) dbo.get("key");
            if(o != null){
                //if(o.keySet().size()!=1){
                    for(String s: o.keySet()){
                        return s;//only success path
                    }
                //}
            }
        }
        return field;
    }

    public DBObject getIndexedFields(DBCollection col){
        DBObject message = new BasicDBObject();
        BasicDBList fields = new BasicDBList();
        for (DBObject dbObject : col.getIndexInfo()) {
            fields.add(dbObject);
        }
        message.put(fieldToken, fields);
        return message;
    }

    /**
     * given something like this:
     * { "v" : 1 , "key" : { "INFO.SNPEFF_GENE_NAME" : 1.0} , "ns" : "workspace.w098898c6cce952e98923db053bb526c9d603f40d" , "name" : "INFO.SNPEFF_GENE_NAME_1"}
     * @param col   e.g. db.w098898c6cce952e98923db053bb526c9d603f40d
     * @param key    e.g. "key"
     * @param expected e.g.   INFO.SNPEFF_GENE_NAME
     * @return
     */
    public boolean hasIndex(DBCollection col, String key, String expected){

        for (DBObject dbObject : col.getIndexInfo()) {
            //System.out.println(dbObject.toString());
            //IF IT EXISTS, it is going to look like this:
            //{ "v" : 1 , "key" : { "INFO.SNPEFF_GENE_NAME" : 1.0} , "ns" : "workspace.w098898c6cce952e98923db053bb526c9d603f40d" , "name" : "INFO.SNPEFF_GENE_NAME_1"}
            BasicDBObject bkey = (BasicDBObject) dbObject.get(key);
            Integer v = (Integer) bkey.get(expected);
            if(v != null){
                if(v == 1) return true;
            }

        }
        return false;
    }

    /**
     * get the status on an indexing/delete_index op
     * Examples of some ops:
     * INDEXING EXAMPLE
     * { "inprog" : [ { "opid" : 2676 , "active" : true , "secs_running" : 0 , "op" : "insert" , "ns" : "workspace.system.indexes" , "insert" : { "v" : 1 , "key" : { "INFO.MLEAF" : 1} , "ns" : "workspace.wd5e9246fe1060d7fd0ca53628039ae006389a40a" , "name" : "INFO.MLEAF_1"} , "client" : "127.0.0.1:55250" , "desc" : "conn24" , "threadId" : "0x105f0a000" , "connectionId" : 24 , "locks" : { "^" : "w" , "^workspace" : "W"} , "waitingForLock" : false , "msg" : "index: (1/3) external sort Index: (1/3) External Sort Progress: 1/826 0%" , "progress" : { "done" : 2 , "total" : 826} , "numYields" : 0 , "lockStats" : { "timeLockedMicros" : { } , "timeAcquiringMicros" : { "r" : 0 , "w" : 4}}}]}
     * dropping index
     * { "inprog" : [ { "opid" : 2676 , "active" : true , "secs_running" : 0 , "op" : "insert" , "ns" : "workspace.system.indexes" , "insert" : { "v" : 1 , "key" : { "INFO.MLEAF" : 1} , "ns" : "workspace.wd5e9246fe1060d7fd0ca53628039ae006389a40a" , "name" : "INFO.MLEAF_1"} , "client" : "127.0.0.1:55250" , "desc" : "conn24" , "threadId" : "0x105f0a000" , "connectionId" : 24 , "locks" : { "^" : "w" , "^workspace" : "W"} , "waitingForLock" : false , "msg" : "index: (1/3) external sort" , "numYields" : 0 , "lockStats" : { "timeLockedMicros" : { } , "timeAcquiringMicros" : { "r" : 0 , "w" : 4}}}]}
     * Query that checks that the index is deleted
     * { "inprog" : [ { "opid" : 2678 , "active" : true , "secs_running" : 0 , "op" : "query" , "ns" : "workspace" , "query" : { "deleteIndexes" : "wd5e9246fe1060d7fd0ca53628039ae006389a40a" , "index" : "INFO.MLEAF_1"} , "client" : "127.0.0.1:55250" , "desc" : "conn24" , "threadId" : "0x105f0a000" , "connectionId" : 24 , "waitingForLock" : false , "numYields" : 0 , "lockStats" : { "timeLockedMicros" : { "r" : 0 , "w" : 793} , "timeAcquiringMicros" : { "r" : 0 , "w" : 6}}}]}
     */
    public DBObject getStatus4opsOnWorkspace(String workspace){
        BasicDBObject ret = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        //get the status on all ops:
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection("$cmd.sys.inprog");
        for (DBObject allops : col.find()) {
            BasicDBList inprog = (BasicDBList) allops.get("inprog");  //inprog is a list of 0+ operations
            for(int i=0;i<inprog.size();i++){
                DBObject op = (DBObject) inprog.get(i);
                if(op.toString().contains(workspace)){ //this op is working on the workspace passed from the user...
                    l.add(op);
                }
            }
        };
        ret.append("current_operations", l);
        return ret;
    }
    
}
