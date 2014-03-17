package edu.mayo.ve.resources;


import com.mongodb.*;
import edu.mayo.ve.CacheMissException;
import edu.mayo.ve.util.LastHit;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.SystemProperties;
import edu.mayo.ve.util.Tokens;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.regex.Pattern;

@Path("/ve/typeahead")
public class TypeAheadResource {
    Mongo m = MongoConnection.getMongo();
    /**
     * returns the values in the typeahead collection for a given workspace, return ALL
     * @param workspaceID
     * @return
     */
    @GET
    @Path("/w/{workspace_id}")
    @Produces("application/json")
    public String getTypeAhead(@PathParam("workspace_id") String workspaceID){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.TYPEAHEAD_COLLECTION);
        BasicDBObject dbo = new BasicDBObject();
        dbo.put(Tokens.KEY, workspaceID);
        DBCursor obs = col.find(dbo);
        while(obs.hasNext()){
            return obs.next().toString(); //just return the first
        }
        return "{\""+Tokens.KEY.toString()+"\":\""+workspaceID+"\"}";//type-ahead not constructed
    }

    @GET
    @Path("/w/{workspace_id}/f/{field}")
    @Produces("application/json")
    public String getTypeAhead4Value(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field
    ){
        if(field.startsWith("INFO")){
            field = field.substring(5);
        }
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.TYPEAHEAD_COLLECTION);
        BasicDBObject dbo = new BasicDBObject();
        dbo.put(Tokens.KEY, workspaceID);
        BasicDBObject keys = new BasicDBObject();
        keys.put(field, 1);
        DBCursor obs = col.find(dbo, keys);
        while(obs.hasNext()){
            return obs.next().toString(); //just return the first
        }
        return "{\""+Tokens.KEY.toString()+"\":\""+workspaceID+"\"}";//type-ahead not constructed
    }

    public int countTypeAheadValuesBasedOnCache(String workspace, String field, String prefix) throws CacheMissException {
        return getTypeAheadFromMongoCache(workspace,field,prefix,Integer.MAX_VALUE).size();
    }


    /**
     * use the MongoDB cache to satisfy the type-ahead request.
     * @param workspace
     * @param field
     * @param prefix
     * @param maxValues
     * @return
     */
    public BasicDBList getTypeAheadFromMongoCache(String workspace,String field,String prefix, int maxValues) throws CacheMissException {
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.TYPEAHEAD_COLLECTION);
        String newField;
        if(field.startsWith("INFO.")){   //type-ahead does not store the INFO.
            newField = field.replace("INFO.","");
        }else{
            newField = field;
        }
        BasicDBObject query = new BasicDBObject();
        query.put(Tokens.KEY, workspace);
        BasicDBObject keys = new BasicDBObject();
        keys.put(newField, 1);
        DBCursor obs = col.find(query, keys);
        while(obs.hasNext()){
            DBObject next = obs.next();
            BasicDBList l = (BasicDBList) next.get(newField);
            l=truncate(l,prefix,maxValues);
            return l; //just return the first
        }
        DBObject ex = new BasicDBObject();
        ex.put(Tokens.KEY, workspace);
        ex.put("Status", "cache miss - no data");
        throw new CacheMissException(ex.toString());
    }

    /**
     * if we have the full list but need to truncate it because max-values or prefix wants it filtered
     */
    public BasicDBList truncate(BasicDBList l, String prefix, int maxValues){
        if(prefix == null) prefix = "";
        BasicDBList ret = new BasicDBList();
        if(l == null){
            l = new BasicDBList();
        }
        Iterator vitter = l.iterator();
        for(int i=0; vitter.hasNext(); i++){
            if(ret.size()==maxValues){ return ret;}
            String next = (String) vitter.next();
            if(prefix.length()==0 || next.startsWith(prefix)){
                ret.add(next);
            }
        }
        return ret;
    }

    public int countTypeAheadValuesBasedOnIndex(String workspace, String field, String prefix){
        return getTypeAheadFromMongoIndex(workspace,field,prefix,Integer.MAX_VALUE).size();
    }

    /**
     * use the index on the field itself to satisfy the type-ahead request
     * @param workspace
     * @param field
     * @param prefix
     * @param maxValues
     * @return
     */
    public BasicDBList getTypeAheadFromMongoIndex(String workspace, String field, String prefix, int maxValues){
        //fix the field if needed
        String sfield = field;
        if(!field.startsWith("INFO")){
            sfield = "INFO." + field;  //for now only INFO fields do a type-ahead
        }
        //get all the distinct values for a field (e.g. gene)... in mongo this is expressed as thus:
        //db.w098898c6cce952e98923db053bb526c9d603f40d.distinct( 'INFO.SNPEFF_GENE_NAME' )
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
        DBCollection col = db.getCollection(workspace);
        BasicDBObject query = constructQuery(sfield, prefix);

        BasicDBList l = (BasicDBList) col.distinct(sfield, query); //the distinct values have to fit in memory
        BasicDBList arr = new BasicDBList();
        if(maxValues < l.size()){
            for (int i =0; i<maxValues;i++) {
                String s = (String)l.get(i);
                arr.add(s);
            }
            l = arr;
        }

        if(l == null || l.size() < 1){
            l = new BasicDBList();
            return l;
        }else {
            if(l.get(0)==null){
                l.remove(0);  //the first value is null for some reason :(
            }
        }
        return l;
    }

    /**
     * construct a query object for getTypeAheadFromMongoIndex
     * @param prefix
     * @return
     */
    private BasicDBObject constructQuery(String field, String prefix){
        BasicDBObject query = new BasicDBObject();

        // $regex can only use an index efficiently when the regular expression has an anchor for the beginning (i.e. ^)
        // of a string and is a case-sensitive match. Additionally, while /^a/, /^a.*/, and /^a.*$/ match equivalent strings,
        // they have different performance characteristics. All of these expressions use an index if an appropriate index exists;
        // however, /^a.*/, and /^a.*$/ are slower. /^a/ can stop scanning after matching the prefix.
        //
        //This results in something like:
        //> db.w8942962b64815c6a0005675d67c07f7e867423b9.distinct('INFO.SNPEFF_IMPACT',{"INFO.SNPEFF_IMPACT":{$regex:/^MODE/}})
        //[ "MODERATE" ]
        if(prefix != null && prefix.length() > 0){
            BasicDBObject regex = new BasicDBObject();
            //Pattern pattern = Pattern.compile("^"+prefix+"", Pattern.CASE_INSENSITIVE);
            Pattern pattern = Pattern.compile("^"+prefix);
            regex.append("$regex",pattern);
            query.append(field,regex);
        }
        //System.out.println(query.toString());
        return query;
    }

    /**
     * gets the approximate number of distinct values for a field
     * e.g.   SNPEFF_EFFECT = [
     1. CODON_CHANGE_PLUS_CODON_DELETION
     2. CODON_CHANGE_PLUS_CODON_INSERTION
     3. CODON_DELETION
     4. CODON_INSERTION
     5. DOWNSTREAM
     6. EXON
     7. EXON_DELETED
     8. FRAME_SHIFT
     9. INTERGENIC
     10. INTRAGENIC
     11. INTRON
     12. NON_SYNONYMOUS_CODING
     13. NON_SYNONYMOUS_START
     14. SPLICE_SITE_ACCEPTOR
     15. SPLICE_SITE_DONOR
     16. START_GAINED
     17. START_LOST
     18. STOP_GAINED
     19. STOP_LOST
     20. SYNONYMOUS_CODING
     21. SYNONYMOUS_STOP
     22. UPSTREAM
     23. UTR_3_PRIME
     24. UTR_5_PRIME
     * @return the number of distinct values e.g. 24 (or in the case of a field that is not indexed the number of values in the cache)
     * if the number is unknown, then it is: Integer.MAX_VALUE.
     */
    @GET
    @Path("/getDistinctCount4Field/w/{workspace_id}/f/{field}")
    @Produces("application/json")
    public String getDistinctCount4Field(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field) throws IOException, CacheMissException {
        if(typeAheadOverrun == null){
            SystemProperties sysprops = new SystemProperties();
            typeAheadOverrun = new Integer( sysprops.get("type_ahead_overrun") );
        }
        DBObject ret = new BasicDBObject();
        ret.put(Tokens.KEY, workspaceID);
        ret.put("field", field);
        int count = countTypeAheadValuesBasedOnCache(workspaceID, field, "");
        if(typeAheadOverrun <= count){
            //if the field is indexed, then try to get an accurate count from there
            if(isIndexed(workspaceID,field)){
                count = countTypeAheadValuesBasedOnIndex(workspaceID,field,"");
                ret.put("count", count);
            }else {
                //we can't return an accurate count, just return the biggest number AKA infinity.
                ret.put("count", Integer.MAX_VALUE);
            }
        }else {
            ret.put("count", count);
        }
        return ret.toString();
    }
    private static Integer typeAheadOverrun = null;

    /**
     * only to be used by unit tests!
     * @param typeAheadOverrun
     */
    public static void setTypeAheadOverrun(Integer typeAheadOverrun) {
        TypeAheadResource.typeAheadOverrun = typeAheadOverrun;
    }


    /**
     * A version of the endpoint without a prefix
     * @param workspaceID  - the key/collection name
     * @param field        - the field we want the type-ahead on e.g. INFO.SNPEFF_GENE
     * @param maxValues    - the maximum number of values to return
     * @return
     */
    @GET
    @Path("/w/{workspace_id}/f/{field}/x/{maxValues}")
    @Produces("application/json")
    public String getTypeAhead4Value(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field,
            @PathParam("maxValues") Integer maxValues
    ){
        return getTypeAhead4Value(workspaceID, field, "", maxValues);
    }



    LastHit lastHit = null;
    /**
     *
     * @param workspaceID  - the key/collection name
     * @param field        - the field we want the type-ahead on e.g. INFO.SNPEFF_GENE
     * @param prefix       - the first N characters of the values we want (to show to the user)
     * @param maxValues    - the maximum number of values to return
     * @return
     */
    @GET
    @Path("/w/{workspace_id}/f/{field}/p/{prefix}/x/{maxValues}")
    @Produces("application/json")
    public String getTypeAhead4Value(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field,
            @PathParam("prefix") String prefix,
            @PathParam("maxValues") Integer maxValues
    ){

        BasicDBObject ret = new BasicDBObject();
        //first, can we satisfy the request with the lastHit?
        if(lastHit != null){
            if(lastHit.canSatisfyRequest(workspaceID,field,prefix,maxValues)){
                ret.append(field,lastHit.satisfyRequest(prefix,maxValues));
                return ret.toString();
            }
        }
        //else, we have to go to disk to satisfy the request...
        try {
            DB db = m.getDB(Tokens.WORKSPACE_DATABASE);

            //if the field is not indexed --- later optimization -> AND cache was NOT overflown on load
            if(!this.isIndexed(workspaceID, field)){
                BasicDBList l = getTypeAheadFromMongoCache(workspaceID, field, prefix, maxValues);
                ret.append(field,l);
                lastHit = new LastHit(workspaceID, field, prefix, maxValues, l);//update lastHit
                return ret.toString();
            }else {
                //use the index to return the fields needed
                BasicDBList l = getTypeAheadFromMongoIndex(workspaceID, field, prefix, maxValues);
                ret.append(field,l);
                lastHit = new LastHit(workspaceID, field, prefix, maxValues, l);//update lastHit
                return ret.toString();
            }
        } catch (Exception e){
            BasicDBObject fail = new BasicDBObject();
            fail.put(Tokens.KEY, workspaceID);
            if(e.getMessage()!=null){
                fail.put("status", e.getMessage());
            }else {
                fail.put("status", "type-ahead query had no results (fail or null?)");
            }
            BasicDBList emptyL = new BasicDBList();
            fail.put(field, emptyL);
            return fail.toString();
        }
    }

    private long time2live = 300000; //5 min
    private final String time2liveToken = "_time2liveToken_";
    //private HashMap<String,HashMap<String,Long>> indexedCache = new HashMap<String,HashMap<String,Long>>();  //this is causing a major bug!

    edu.mayo.ve.index.Index iutil = new edu.mayo.ve.index.Index();
    public HashMap<String,Long> getCache(String workspaceID){
        long currentTime = System.currentTimeMillis();
        HashMap<String,Long> cache = null;//indexedCache.get(workspaceID);
        if(cache == null){
            cache = updateCache(workspaceID);
            //indexedCache.put(workspaceID, cache);
        }
        long lastUpdate = cache.get(time2liveToken);
        if(lastUpdate + time2live > currentTime){
            return cache;
        }else { //update the cache
            return updateCache(workspaceID);
        }
    }

    /**
     * update cache - for a given collection, go to the database and update the cache.
     * @return
     */
    public HashMap<String,Long> updateCache(String workspaceID){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(workspaceID);
        HashMap<String,Long> cache = new HashMap<String,Long>();
        //update the cache with the most up-to-date information from the MongoDB indexes
        List<String> indexedFieldsAsStrings = iutil.getIndexedFieldsAsStrings(col, true);
        for(String field : indexedFieldsAsStrings){
            cache.put(field,new Long(1));
        }
        //update the cache with the most up-to-date information from the metadata collection.

        String workspace = col.getFullName();
        cache.put(time2liveToken, System.currentTimeMillis());
        //add this cache back to the in-memory version of the cache
        //indexedCache.put(workspaceID,cache);
        return cache;
    }

    /**
     * given a cache<field_string,1>, we would like to change the 1 that exists in every value to the following values
     * based on
     * @param hm
     * @return
     */
    public HashMap<String,Long> updateCacheMetaData(HashMap<String,Long> hm){
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        //DBCollection col = db.getCollection(workspaceID);
        return hm;
    }

    public boolean isIndexed(String workspace, String field){
        HashMap<String,Long> cache = getCache(workspace);
        int loc = field.indexOf(".");
        String shortfield = field;
        if(loc > 0){
            shortfield = field.substring(loc+1,field.length());
        }
        if(cache.containsKey(field)){
            return true;
        }
        if(cache.containsKey(shortfield)){
            return true;
        }
        if(cache.containsKey("INFO."+field)){
            return true;
        }
        if(cache.containsKey("FORMAT."+field)){
            return true;
        }
        return false;
    }

    /** used for unit testing */
    public long getTime2live() {
        return time2live;
    }

    /** used for unit testing */
    public void setTime2live(long time2live) {
        this.time2live = time2live;
    }

    /** mostly used for unit testing */
    public void clearLastHit(){
        lastHit = null;
    }

//    /** used for unit testing */
//    public HashMap<String, HashMap<String, Long>> getIndexedCache() {
//        return indexedCache;
//    }
//
//    /** used for unit testing */
//    public void setIndexedCache(HashMap<String, HashMap<String, Long>> indexedCache) {
//        this.indexedCache = indexedCache;
//    }


}
