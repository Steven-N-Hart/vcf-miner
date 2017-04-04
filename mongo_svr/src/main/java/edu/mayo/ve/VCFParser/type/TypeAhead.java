package edu.mayo.ve.VCFParser.type;

import com.google.gson.Gson;
import com.mongodb.*;
import com.mongodb.util.JSON;
import edu.mayo.ve.util.Tokens;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * User: m102417
 * Date: 9/10/13
 * Time: 9:08 AM
 *
 * TypeAhead - The point of this class is to hold n values for each key in the mongo instance.
 * This subset of all possible values will be used by the system to provide type-ahead type REST calls to give the user options
 * for the values in a given field (e.g. look-ahead all values for a pathway provided in the info field)
 * Type ahead will attempt to determine if a field is an integer/float/double and if so, it will not try to cache values for that.
 */
public class TypeAhead {
    /**
     * cache contains for each key in the input data (e.g. INFO.SNPEFF_AMINO_ACID_CHANGE) all unique values that have been seen so far
     *
     */
    private HashMap<String,Set<String>> cache = new HashMap<String, Set<String>>();
    /** overRun contains for each key a boolean, true if the cache was over-run, false if the cache has all of the values */
    private HashMap<String,Boolean> overRun = new HashMap<String,Boolean>();
    private String cacheOnly = ""; // only cache keys with this prefix (e.g. INFO)
    int maxval = 1000; //the maximum number of values that will be cached
    private boolean reporting = false;
    public TypeAhead(int maxValuesToCache, boolean reportingSet){
        maxval = maxValuesToCache;
        reporting = reportingSet;
        if(reporting) System.out.println("Max Value for Type-Ahead Cache: " + maxval);
    }

    public TypeAhead(String cacheValuesThatStart, int maxValuesToCache, boolean reportingSet){
        maxval = maxValuesToCache;
        cacheOnly = cacheValuesThatStart;
        reporting = reportingSet;
        if(reporting) System.out.println("Max Value for Type-Ahead Cache: " + maxval);
    }

    /**
     * given a json string, add values to the cache if not already there.
     * @param json
     */
    public void addCache(String json){
        BasicDBObject bo = (BasicDBObject) JSON.parse(json);
        addCache(bo);
    }

    public void addCache(BasicDBObject bo){
        for(String key: bo.keySet()){
            if(cacheOnly.length()>0){
                if(key.startsWith(cacheOnly)){
                    cacheIT(key,bo.get(key));
                }
            }else{ //no restrictions, cache everything!
                cacheIT(key,bo.get(key));
            }
        }
    }

    private void cacheIT(String key, Object value){
        Set<String> prev = cache.get(key);
        if(prev == null){
            prev = new HashSet<String>();
        }

        //if we are overrunning the cache, report that fact.
        if(prev.size() >= this.maxval-1){
            overRun.put(key,true);
        }

        //if it is an integer, don't cache it, but if it is a string, then do
        if( value instanceof String  && prev.size() < this.maxval){
            prev.add((String) value);
            cache.put(key,prev);
        //else it is a list, we need to cache every value in the list (potentially)
        }else if( value instanceof BasicDBList){
            BasicDBList l = (BasicDBList) value;
            for(int i=0; i<l.size(); i++){
                Object o = l.get(i);
                cacheIT(key, l.get(i));
            }
        //else, it is an object, we need to drill into it
        }else if(value instanceof BasicDBObject){
            //breadth first search cuz whatever...
            BasicDBObject v = (BasicDBObject) value;
            for(String k : v.keySet()){
                cacheIT(k,v.get(k));
            }
        }
        //System.out.print(key + ": ");
        //System.out.println(value.toString());
    }

    public void clearCache(){
        this.cache = new HashMap<String, Set<String>>();
    }

    /**
     * saves all know values to the typeahead collection for fast retreval via the restful front end
     */
    public void save(Mongo m, String workspace){
        DB db = m.getDB( Tokens.WORKSPACE_DATABASE );
        DBCollection col = db.getCollection(Tokens.TYPEAHEAD_COLLECTION);
        BasicDBObject thead = convertCacheToDBObj(workspace);
        col.save(thead);
    }

    /**
     * convert the current cache in memory to a mongo DBObject
     */
    public BasicDBObject convertCacheToDBObj(String workspace){
        int overCount =0;
        BasicDBObject thead = new BasicDBObject();
        thead.put(Tokens.KEY, workspace);
        BasicDBObject overrun = new BasicDBObject();
        for(String key : this.cache.keySet()){
            if(overRun.get(key)!=null){
                if(overRun.get(key)!=null){
                    overrun.put(key,true);
                    overCount++;
                }
            }
            int numberOfNumericValues = 0;
            Set<String> values = cache.get(key);
            BasicDBList l = new BasicDBList();
            for(String s: values){
                l.add(s);
                if(isNumber(s)){
                    numberOfNumericValues++;
                }
            }
            if( numberOfNumericValues != l.size()){  //if it is all numbers then we don't want to save it
                //error checking... mongo can't take period/dot (.) in a key, so lets replace with underscore.
                String newkey = key;
                if(key.contains(".")){
                   newkey = key.replace(".","_");
                }
                thead.put(newkey, l);
            }
        }
        if(overCount > 0){
            thead.put(Tokens.TYPE_AHEAD_OVERUN, overrun);
        }
        return thead;
    }

    /**
     * checks to see if a vcf value is a number example numbers include:
     * 0.0
     * 0
     * 1
     * 1.1
     * 1,2,3
     * 1.1,2,3
     *
     * @param value
     * @return
     */
    private boolean isNumber(String value){
        try{
            if(value.contains(",")){
                isNumberList(value, ",");
            }else {
                Double tryDouble = new Double(value);
            }
        }catch(Exception e){
            return false;
        }
        return true;
    }

    private boolean isNumberList(String value, String token) throws Exception{
        if(value != null){
            String[] split = value.split(token);
            for(String s: split){
                Double tryDouble = new Double(s);
            }
        }else {
            return false;
        }
        return true;
    }

    protected HashMap<String,Set<String>> getCache(){
        return cache;
    }

    public Set<String> getOverunFields(){
        return overRun.keySet();
    }

}
