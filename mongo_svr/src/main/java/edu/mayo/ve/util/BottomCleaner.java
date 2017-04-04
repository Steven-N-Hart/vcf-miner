package edu.mayo.ve.util;

import com.google.common.collect.Sets;
import com.mongodb.*;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;

import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 11/20/13
 * Time: 3:23 PM
 * BottomCleaner's job is to reach into MongoDB, detect if there are workspaces without any metadata and delete them if they exist
 */
public class BottomCleaner {

    private Mongo m = MongoConnection.getMongo();

    /**
     *
     * @return a list of all workspaces that are collections
     */
    public List<String> allWorkspaceCollections(){
        ArrayList<String> ret = new ArrayList<String>();
        DB db = MongoConnection.getDB();
        Set<String> colls = db.getCollectionNames();
        for(String s : colls){
            if(s.startsWith("w")){
                if(s.length() == "wf5a4c47e92f5f7445a4253f125b0938d2033df47".length()){
                    ret.add(s);
                    //System.out.println(s);
                }
            }
        }
        return ret;
    }

    /**
     *
     * @return a list of workspaces that don't have metadata
     */
    public HashMap<String,DBObject> allWorkspacesWithMetadata(){
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);
        List<String> workspaces = allWorkspaceCollections();
        HashMap<String,DBObject> workspacesWithMetadata = new HashMap<String,DBObject>();
        for(String w : workspaces){
            BasicDBObject dbo = new BasicDBObject();
            dbo.put("key", w);
            DBCursor cursor = col.find(dbo);//there will be at most one result in the result set
            //load the workspaces that have metadata to memory...
            if(cursor.hasNext()){
                DBObject  next = cursor.next();
                workspacesWithMetadata.put((String)next.get(Tokens.KEY),next);
                //System.out.println(next.toString());
            }
        }
        //if it is not processing
        return workspacesWithMetadata;
    }

    /**
     * given a list of workspace keys where there is no metadata, drop the collections that corespond to those workspaces.
     * @param workspaces
     */
    public void dropWorkspacesWOMetadata(List<String> workspaces){
        DB db = MongoConnection.getDB();
        for(String w : workspaces){
            DBCollection col = db.getCollection(w);
            col.dropIndexes();
            col.drop();
        }
    }

    public void dropWorkspacesWOMetadata(){
        dropWorkspacesWOMetadata(allWorkspacesWithoutMetadata());
    }

    public List<String> allWorkspacesWithoutMetadata(){
        return negation(new ArrayList(allWorkspacesWithMetadata().keySet()), allWorkspaceCollections());
    }

    /**
     * Used to find the intersection between the workspaces with metadata and the workspaces without
     * e.g. every element in the return set WILL have metadata and data in a collection.
     * @param set1
     * @param set2
     * @return
     */
    public List<String> intersection(List<String> set1, List<String> set2){
        return intersection(Sets.newHashSet(set1),Sets.newHashSet(set2));
    }

    public List<String> intersection(Set<String> set1, Set<String> set2){
        Set<String> intersection = Sets.intersection(set1, set2);
        return new ArrayList(intersection);
    }

    public List<String> negation(List<String> set1, List<String> set2){
        return negation(new HashSet(set1), new HashSet(set2));
    }

    /**
     * takes the negation of set1 using set2 as the world.  e.g. the return set will contain elements in set2 but NOT in set1.
     * @param set1
     * @param set2
     * @return
     */
    public List<String> negation(Set<String> set1, Set<String> set2){
        HashSet<String> neg = new HashSet<String>();
        neg.addAll(set2);
        neg.removeAll(set1);
        return new ArrayList(neg);
    }
}
