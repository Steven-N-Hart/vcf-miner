/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.VCFParser;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mongodb.*;
import com.mongodb.util.JSON;
import com.tinkerpop.pipes.Pipe;
import com.tinkerpop.pipes.util.Pipeline;
import edu.mayo.TypeAhead.TypeAheadInterface;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.index.Index;
import edu.mayo.parsers.ParserInterface;
import edu.mayo.pipes.UNIX.CatPipe;
import edu.mayo.pipes.bioinformatics.SampleDefinition;
import edu.mayo.pipes.bioinformatics.VCF2VariantPipe;
import edu.mayo.pipes.history.History;
import edu.mayo.pipes.history.HistoryInPipe;
import edu.mayo.pipes.iterators.Compressor;
import edu.mayo.security.CWEUtils;
import edu.mayo.senders.FileSender;
import edu.mayo.senders.Sender;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.SystemProperties;
import edu.mayo.util.Tokens;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.ve.resources.SampleMeta;
import edu.mayo.ve.util.IOUtils;

import java.io.File;
import java.io.IOException;
import java.io.LineNumberReader;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Pattern;

//import edu.mayo.cli.CommandPlugin; TO DO! get this to work :(


/**
 *
 * @author m102417
 */
public class VCFParser implements ParserInterface {


    private int cacheSize = 50000;
    private Mongo m = MongoConnection.getMongo();
    /** testingCollection contains all of the objects placed into the workspace from parsing the VCF */
    HashMap<Integer,String> testingCollection = new HashMap<Integer,String>();
    JsonObject json = null;
    /** @param context                 - the execution context (so we can kill the process if needed)  -- can be null */
    private Task context = null;
    /**  @param testing    -- populate in-memoryt testingCollection instead of Mongo.  */
    private boolean testing = false;
    /** @param reporting - if verbose output is desired (much slower and not for production use, use when debugging) */
    private boolean reporting = false;

    private Double initialLinePerformance = 0.0;
    private Double averageLinePerformance = 0.0;

    private static final Pattern ID_PATTERN = Pattern.compile("\"_id\":");
    private static final Pattern INFINITY_PATTERN = Pattern.compile("Infinity");

    public static void usage(){
            System.out.println("This program will parse a VCF file, obtain the 'schema' for that VCF and populate a MongoDB database with the variants in the VCF.");
            System.out.println("");
            System.out.println("Make sure to check your sys.properties file fo the MongoDB IP/Port combination, otherwised this script may fail");
            System.out.println("usage: VCFParser <input.vcf> <workspace_id>");

    }

    /**
     *
     * @return  The path to an error file that will show all errors with the load
     */
    public String getErrorFile(String workspace){
        try {
            SystemProperties sysprops = new SystemProperties();
            String tmp = sysprops.get("TEMPDIR");
            return tmp + File.separator + workspace + ".errors";
        }catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    /** legacy interface, keep it in place for testing */
    public int parse(Task context, String infile, String workspace) throws ProcessTerminatedException {
        return parse(context, infile, workspace, false, false);
    }

    /** legacy interface, keep it in place for testing */
    public int parse(Task context, String infile, String workspace, boolean testing, boolean reporting) throws ProcessTerminatedException {
        this.reporting = reporting;
        this.testing = testing;
        return parse(infile, workspace);
    }

    /**
     * This method makes it easier to test the logic in the VCF file by enabling testing methods
     * to directly get the parsing pipeline.
     * @return
     */
    public Pipe getPipeline(VCF2VariantPipe vcf, String infile){
        Pipe p = new Pipeline(new CatPipe(),
// TODO: necessary to account for these here?  or put in vcf-miner documentation?
//                new ReplaceAllPipe("\\{",""),
//                new ReplaceAllPipe("\\}",""),
                new HistoryInPipe(),
                vcf
        );
        p.setStarts(Arrays.asList(infile));
        return p;
    }

    /**
     * This is the simple direct interface that just works when we need a simple parser.
     * parse the infile, which is a raw vcf and put it into the mongo workspace
     * @param infile     - the raw complete (cononical) path to the file we want to parse as a string.
     * @param workspace  - the key for the workspace where we will put the data
     * @return lines processed.
     */
    public int parse(String infile, String workspace) throws ProcessTerminatedException{
        MetaData meta = new MetaData();
        //change the status from queued to importing:
        meta.flagAsImporting(workspace);

        Sender sender = new FileSender(getErrorFile(workspace));
        if(reporting){ System.out.println("Getting the vcf-miner database from mongo"); }
        DB db = MongoConnection.getDB();
        if(reporting){ System.out.println("Getting the workspace collection from mongo"); }
        DBCollection col = db.getCollection(workspace);
        if(reporting){
            System.out.println("Setting up Pipeline,\n input file: " + infile);
            System.out.println("Workspace: " + workspace);
            System.out.println("Testing: " + testing);
            System.out.println("Reporting: " + reporting);
        }
        VCF2VariantPipe vcf = new VCF2VariantPipe(sender, true, false);
        Pipe p = getPipeline(vcf, infile);

        int i;
        long starttime = System.currentTimeMillis();
        DBObject jsonmeta = null;
        boolean storedVariantCount = false;
        if(reporting) System.out.println("Processing Data....");
        try {
            for(i=0; p.hasNext(); i++){

                if(context!=null){ if(context.isTerminated()) throw new ProcessTerminatedException(); }

                if (!storedVariantCount) {
                    try {

                        storeVariantCount(new File(infile), vcf.getHeaderLineCount(), workspace);

                    } catch (IOException ioe) {
                        throw new RuntimeException(ioe);
                    }
                    storedVariantCount = true;
                }

                // if the line # is equally divisble by 256 (power of 2)
                if (fastModulus(i, 256) == 0) {
                    storeCurrentVariantCount(i, workspace);
                }

                if(reporting) System.out.println(col.count());
                History h = (History) p.next();
                // last column in history is the JSON produced by the VCF2VariantPipe
                String s = h.get(h.size() - 1);
                // swap "_id" with "_ident" prior to inserting into mongo
                s = ID_PATTERN.matcher(s).replaceAll("\"_ident\":");
                // swap "Infinity" text for number
                s = INFINITY_PATTERN.matcher(s).replaceAll("2147483648");

                BasicDBObject bo = (BasicDBObject) JSON.parse(s);

                //for type-ahead, we need access to the metadata inside the loop, try to force that here
                if(jsonmeta == null){
                    //System.out.println(vcf.getJSONMetadata().toString());
                    jsonmeta = (DBObject) JSON.parse(vcf.getJSONMetadata().toString());
                    jsonmeta = removeDots(jsonmeta, reporting);
                }

                if(reporting){
                    System.out.println("row before removing dots:"); System.out.println(s);  }
                if(testing){
                    testingCollection.put(new Integer(i), s);
                }else {//production
                    col.save(removeDots(bo, reporting));
                }
                if(reporting){
                    System.out.println("i:" + i + "\ts:" + s.length());
                }

                long curtime = System.currentTimeMillis();
                averageLinePerformance = 1.0*(curtime-starttime)/(i+1);
                if(i<50){
                    //consider burn in, this is the initial reading(s)...
                    initialLinePerformance = averageLinePerformance;
                }

            }

            // final time, update current count
            storeCurrentVariantCount(i, workspace);

        } finally {
            // close the FileSender so that all messages are flushed to disk
            sender.close();
        }

        try {
            addPoundSamples(vcf.getSampleDefinitions(), workspace);
        }catch (IOException e){
            //this exception happens when the configuration file, sys.properties is not set up correctly.
            throw new ProcessTerminatedException();
        }

        json = vcf.getJSONMetadata();

        //do some small fixes to the metadata before continuing...
        //if(reporting){System.out.println("Updating metadata with type-ahead informaton");}
        //DEPRICATED!!!
        //json = updateMetadataWTypeAhead(json, typeAhead.getOverunFields());
        if(reporting){System.out.println("Changing the structure of the FORMAT metadata");}
        metadata = this.fixFormat((DBObject)JSON.parse(json.toString()));

        if(!testing){
            if(reporting){System.out.println("Updating metadata in database...");}
            updateMetadata(workspace, metadata.toString(), reporting);
            if(reporting){System.out.println("indexing...");}
            //change the status from queued to importing:
            meta.flagAsIndexing(workspace);
            index(workspace, vcf, reporting);
            if(reporting){System.out.println("saving type-ahead results to the database");}
        }
        if(reporting){ System.out.println("done!");}
        return i; //the number of records processed
    }

    /**
     * Stores the TOTAL variant count in the 'meta' collection
     * @param vcf
     * @param headerLineCount
     * @param workspaceID
     * @throws IOException
     */
    private void storeVariantCount(File vcf, int headerLineCount, String workspaceID) throws IOException {

        long timestamp = System.currentTimeMillis();
        int variantCount = IOUtils.getLineCount(vcf) - headerLineCount;
        long delta = System.currentTimeMillis() - timestamp;
        int totalLines = variantCount + headerLineCount;
        System.out.println("Took " + delta + "ms to get line count for file " + vcf.getAbsolutePath());

        // store to mongo meta collection
        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspaceID);
        BasicDBObject update = new BasicDBObject();
        update.append("$set", new BasicDBObject().append("variant_count_total", variantCount));
        MongoConnection.getDB().getCollection(Tokens.METADATA_COLLECTION).update(query, update);
    }

    /**
     * Stores the CURRENT variant count in the 'meta' collection.
     * @param currentLineNum
     * @param workspaceID
     */
    private void storeCurrentVariantCount(int currentLineNum, String workspaceID){
        // store to mongo meta collection
        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspaceID);
        BasicDBObject update = new BasicDBObject();
        update.append("$set", new BasicDBObject().append("variant_count_current", currentLineNum));
        MongoConnection.getDB().getCollection(Tokens.METADATA_COLLECTION).update(query, update);
    }

    /**
     * Faster implementation to the Java language modulus "%" operator, which internally uses
     * slow division calculations.  NOTE: this only works if the divisor is a power of 2 (e.g. 2, 4, 8, 16, etc...)
     *
     * @param dividend
     * @param divisor
     * @return
     */
    private int fastModulus(int dividend, int divisor) {
        return dividend & (divisor - 1);
    }



    /**
     * Checks whether the given INFO field has a metadata type of String or Character.
     *
     * @param infoField
     *      The INFO field to be checked.
     * @param metadata
     *      VCF metadata.
     */
    private boolean isStringOrCharacter(String infoField, DBObject metadata) {
        Map headerMap = (Map) metadata.get("HEADER");
        Map infoMap = (Map) headerMap.get("INFO");

        if (infoMap.containsKey(infoField)) {
            Map fieldMetadata = (Map) infoMap.get(infoField);

            String type = (String) fieldMetadata.get("type");
            if(type.equals("String") || type.equals("Character")) {
                return true;
            } else {
                return false;
            }

        } else {
            // no matching ##INFO metadata for this field
            // it's possible the ##INFO is missing completely or not well-formed
            return false;
        }
    }

    /**
     * ##SAMPLE LINES need to be added to their own collection so that later code can query it.
     *    DBObject metadata
     */
    public void addPoundSamples(Iterator<SampleDefinition> iter, String workspace) throws IOException {
        SampleMeta sm = new SampleMeta();
        SystemProperties sysprop = new SystemProperties();
        String poundsamplecol = sysprop.get(SampleMeta.sample_meta_collection);
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(poundsamplecol);

        Gson gson = new Gson();
        //First, get a curser to the ##SAMPLE objects.
        while(iter.hasNext()){
            SampleDefinition sdef = (SampleDefinition) iter.next();
            String json = gson.toJson(sdef);
            BasicDBObject bo = (BasicDBObject) JSON.parse(json);
            bo.append(SampleMeta.sample_meta_key, workspace);
            System.out.println(json);
            col.save(bo);
        }

        sm.indexSampleDocuments();
    }

    private DBObject metadata = null;
    /**
     * for testing...
     */
    public DBObject getMetadata(){
        return metadata;
    }

    public int parse(Task task, String inputVCFFile, String workspace, boolean testing) throws ProcessTerminatedException {
        if(task != null)
            context = task;
        this.testing = testing;
        this.reporting = reporting;
        return parse(inputVCFFile, workspace);
    }

    /**
     * This needs to be called after a parse to ensure that the load gets correctly registered by the UI
     * checks to see if the load worked or if it failed
     * @param workspace - the key for the workspace
     * @param datalines - the number of lines of data in the load file
     * @param force - force the status as successful
     * @return true if it worked, false if it failed.
     */
    public boolean checkAndUpdateLoadStatus(String workspace, int datalines, boolean force){
        MetaData metaData = new MetaData();
        if(force){
            if(reporting) System.out.println("Force flag set, the workspace will be flagged as ready!");
            metaData.flagAsReady(workspace);
        }
        if(reporting) System.out.println("Checking the status of the load");

        //the first way the load could have failed is if the number of records in the workspace != the number of data lines

        BasicDBObject query = new BasicDBObject(); //empty for all
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        long linesLoaded = col.count(query);
        if(linesLoaded != datalines){
            metaData.flagAsFailed(workspace, "The load failed, the number of records in the workspace (" + linesLoaded + ") does not equal the number of data lines in the original file (" + datalines +")" );
            return false;
        }

        //are there other ways we could check / need to check that a load failed?
        return true;
    }

    private class TrackNode {
        public TrackNode(DBObject node, boolean discovered){
            this.node = node;
            this.discovered = discovered;
        }
        public DBObject node;      // the position in the JSON structure where the dfs is pointing
        public DBObject shaddow;   // shaddow is the new node in the copy structure
        public boolean discovered = false;
    }

    /**
     * removeDots uses Depth First Search to traverse the json object hiarchy and replace any keys with a dot (.) in them
     * with keys that have an underscore (_).  This way mongo can load the key.
     * @param bo
     * @param reporting
     * @return
     */
    public DBObject removeDots(DBObject bo, boolean reporting){
        if(bo == null) return bo;
        if(bo.keySet().size() < 1) return bo;
        //Generic non-recursive DFS algorithm is:
        // 1  procedure DFS-iterative(G,v):
        // 2      let S be a stack
        // 3      S.push(v)
        // 4      while S is not empty
        // 5            v ← S.pop()
        // 6            if v is not labeled as discovered:
        // 7                label v as discovered
        // 8                for all edges from v to w in G.adjacentEdges(v) do
        // 9                    S.push(w)
        Stack<TrackNode> s = new Stack<TrackNode>();
        TrackNode v = new TrackNode(bo, false);
        s.push(v);
        while( s.size() > 0){
            v = s.pop();
            if(v.discovered == false){
                v.discovered = true;
                ArrayList<String> keyset = new ArrayList<String>();
                for(String key : v.node.keySet()){
                    //System.out.println(key);
                    keyset.add(key);
                    Object o = v.node.get(key);
                    if(o instanceof DBObject){
                        DBObject d = (DBObject) o;
                        s.push(new TrackNode(d,false));
                    }//else it is data
                }
                for(String key : keyset){
                    if(key.contains(".")){
                        Object o = v.node.get(key);
                        v.node = fixDBObjectDotKey(key, v.node);
                    }
                }
            }
        }
        if(reporting){
            System.out.println("removedDotsResult");
            System.out.println(bo.toString());
            System.out.println("end");
        }
        return bo;
    }

    public String getNth(String prefix, Set<String> keys, int index){
        int count =0;
        for(String key : keys){
            if(index == count) return key;
            count++;
        }
        return null;
    }

    public DBObject removeDots2(DBObject bo, boolean reporting){
        if(reporting) System.out.println("removeDots");
        //first, check to see if the top level directory has any dots
        for(String key : bo.keySet()){
            //first, check all the leafs (one dir down only)!
            Object o = bo.get(key);
            if(o instanceof BasicDBObject){
                BasicDBObject dboo = (BasicDBObject) o;
                //deal with this concurent modification problem...
                List<String> keys = new ArrayList();
                for(String zkey : dboo.keySet()){
                    keys.add(zkey);
                }
                for(String k2 : keys){
                    if(k2.contains(".")){
                        fixDBObjectDotKey(k2,dboo);
                    }
                }
            }
        }
        //now fix and check the branches (can't do in the same loop because of this concurency bug
        for(String key : bo.keySet()){
            //then check the branch
            if(key.contains(".")){
                fixDBObjectDotKey(key, bo);
            }
        }
        if(null != bo.get(".")){
            bo.removeField(".");
        }
        if(null != bo.get("INFO")){
            Object o = bo.get("INFO");
            if(o instanceof DBObject){
                if(  ((DBObject)o).get(".") != null  ){
                    ((DBObject)o).removeField(".");
                    if(  ((DBObject)o).keySet().size() == 0   ){
                        bo.put("INFO", ".");
                    }
                }
            }

        }
        if(reporting){
            System.out.println("removedDotsResult");
            System.out.println(bo.toString());
            System.out.println("end");
        }
        return bo;
    }

    public DBObject fixDBObjectDotKey(String key, DBObject dbo){
        String newkey = key.replaceAll("\\.", "_");
        Object o = dbo.get(key);
        if(o instanceof String){
            String value = (String) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof BasicDBObject){
            BasicDBObject value = (BasicDBObject) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof Integer){
            Integer value = (Integer) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof Double){
            Double value = (Double) o;
            dbo.removeField(key);
            dbo.put(newkey, value);
            return dbo;
        }
        if(o instanceof Boolean){
            Boolean value = (Boolean) o;
            dbo.removeField(key);
            dbo.put(newkey,value);
            return dbo;
        }
        if(o instanceof BasicDBList){
            BasicDBList value = (BasicDBList) o;
            dbo.removeField(key);
            dbo.put(newkey,value);
            return dbo;
        }
        return dbo;
    }


    public void index(String workspace, VCF2VariantPipe vcf, boolean reporting){
        JsonObject json = vcf.getJSONMetadata();
        if(json == null){
            return;
        }
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);

        //auto-index all reserved columns (as needed by the app)
        indexReserved(col, reporting);
        //auto-index all SNPEFF columns
        indexSNPEFF(col, json, reporting);
        //index format
        indexFormat(vcf.getFormatKeys(), col, reporting);
    }

    /**
     * index the reserved fields that we already know about...
     * @param col
     * @param reporting
     */
    private void indexReserved(DBCollection col, boolean reporting){
        indexField("FORMAT.GenotypePostitiveCount", col, reporting);
        indexField("FORMAT.GenotypePositiveList",col, reporting); //don't need to index this as soon as the query is refactored
        indexField("FORMAT.HeterozygousList",col, reporting);
        indexField("FORMAT.HomozygousList",col, reporting);

    }


    private void indexSNPEFF(DBCollection col, JsonObject json, boolean reporting){
        //indexField("INFO.SNPEFF_GENE_NAME", col);
        for(String key: getSNPEFFColsFromJsonObj(json)){
            indexField("INFO." + key, col, reporting);
        }
    }

    /**
     *
     * @param json - the json metadata object
     * @return
     */
    public List<String> getSNPEFFColsFromJsonObj(JsonObject json){
        ArrayList<String> a = new ArrayList<String>();
        JsonObject header = json.getAsJsonObject("HEADER");
        if(header == null) return a;
        JsonObject info = header.getAsJsonObject("INFO");
        if(info == null) return a;
        Iterator<Map.Entry<String,JsonElement>> itter =info.entrySet().iterator();
        while(itter.hasNext()){
            Map.Entry<String, JsonElement> next = itter.next();
            String key = next.getKey();
            //System.out.println(key); //all keys in info
            if(key.contains("SNPEFF")){
                a.add(key);
            }
        }
        return a;
    }

    /**
     *
     * @param formatFields      - a list of fields to index (all format fields)
     * @param col       - the collection/workspace
     * @param reporting - if we want to show what is going on in the tomcat log
     */
    private void indexFormat(Set<String> formatFields, DBCollection col, boolean reporting){
        for(String field : formatFields){
            // FORMAT + . + . + field
            String ikey = "FORMAT." + "min." + field;
            String xkey = "FORMAT." + "max." + field;
            if(reporting){  System.out.println( "Trying to index: " + ikey);  }
            indexField(ikey, col, reporting);
            if(reporting){  System.out.println( "Trying to index: " + xkey);  }
            indexField(xkey, col, reporting);
        }
    }

    private void indexFieldReplacingDot(String field, DBCollection col, boolean reporting){ //don't think this is ever used...
        if(field.contains(".")){
            field = field.replace(".","_");
        }
        indexField(field, col, reporting);
    }

    private Index indexUtil = new Index(); //use the indexUtil instead of the raw interface to prevent duplicate indexes!
    private void indexField(String field, DBCollection col, boolean reporting){
        if(reporting) System.out.println("index: " + field);
        DBObject status = indexUtil.indexField(field,col);
        if(reporting) System.out.println(status.toString());
    }


    public void updateMetadata(String workspace, String jsonUpdate, boolean reporting){
        if(reporting) System.out.println("Saving Metadata to Workspace: " + workspace);
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);
        String query = "{\"key\":\""+workspace+"\"}";
        BasicDBObject bo = (BasicDBObject) JSON.parse(query); //JSON2BasicDBObject
        DBCursor dbc = col.find(bo);
        DBObject result = null;
        while(dbc.hasNext()){
            result = dbc.next();
            break;   //there will only be one that matches!
        }

        String owner = result.get(Tokens.OWNER).toString();
        String id = result.get("_id").toString();
        String alias = result.get(Tokens.WORKSPACE_ALIAS).toString();
        //key = workspace, passed in so we have that!
        col.remove(bo);
        //System.out.println("result: " + result.toString());

        //note, we want to destroy whatever was in there with the new data (in case they try to load multiple times)
        //but we have to keep owner, id, and key.
        BasicDBObject replace = (BasicDBObject) JSON.parse(jsonUpdate);
        //we need to remove any dot keys before we save the metadata to mongo.
        DBObject replaceWODots = removeDots(replace, reporting);

        // carry forward ALL existing keys/value pairs (owner, key, _id, alias, ready, status)
        replaceWODots.putAll(result);

        if(reporting) System.out.println(replaceWODots.toString());
        col.save(replaceWODots);
    }


    /**
     * In the metadata returned, the format field from the vcf-variant pipe looks something like this:
     *
     * "FORMAT": {
     * "PL": 1,
     * "AD": 1,
     * "GT": 1,
     * "GQ": 1,
     * "DP": 1,
     * "MLPSAF": 1,
     * "MLPSAC": 1
     * }
     *
     * This method transforms it into this (which is what mongodb will store):
     * "FORMAT": {
     *      "min": {
     *          "PL": 1,
     *          "AD": 1,
     *          "GT": 1,
     *          "GQ": 1,
     *          "DP": 1,
     *          "MLPSAF": 1,
     *          "MLPSAC": 1
     *      }
     *      "max": {
     *          "PL": 1,
     *          "AD": 1,
     *          "GT": 1,
     *          "GQ": 1,
     *          "DP": 1,
     *          "MLPSAF": 1,
     *          "MLPSAC": 1
     *      }
     * }
     *
     * @param input
     * @return
     */
    public DBObject fixFormat(DBObject input){
        DBObject output = input;
        DBObject oldformat = (DBObject) input.removeField("FORMAT");
        if(oldformat != null){
            DBObject min = new BasicDBObject();
            DBObject max = new BasicDBObject();
            for(String s : oldformat.keySet()){
                min.put(s,1);
                max.put(s,1);
            }
            DBObject format = new BasicDBObject();
            if(min.keySet().size() > 0 && max.keySet().size()>0){
                format.put("min", min);
                format.put("max", max);
            }
            output.put("FORMAT", format);
        }
        return output;
    }

    public HashMap<Integer, String> getTestingCollection() {
        return testingCollection;
    }

    public void setTestingCollection(HashMap<Integer, String> testingCollection) {
        this.testingCollection = testingCollection;
    }

    public JsonObject getJson() {
        return json;
    }

    public void setJson(JsonObject json) {
        this.json = json;
    }

    public Mongo getM() {
        return m;
    }

    public void setM(Mongo m) {
        this.m = m;
    }

    public int getCacheSize() {
        return cacheSize;
    }

    public void setCacheSize(int cacheSize) {
        this.cacheSize = cacheSize;
    }

    public Task getContext() {
        return context;
    }

    public void setContext(Task context) {
        this.context = context;
    }

    public boolean isTesting() {
        return testing;
    }

    public void setTesting(boolean testing) {
        this.testing = testing;
    }

    //TODO: REMOVE ME
    @Override
    public void setTypeAhead(TypeAheadInterface typeAheadInterface) {
    }

    // TODO: REMOVE ME
    public TypeAheadInterface getTypeAhead(){
        return null;
    }

    public boolean isReporting() {
        return reporting;
    }

    public void setReporting(boolean reporting) {
        this.reporting = reporting;
    }

    public void setMetadata(DBObject metadata) {
        this.metadata = metadata;
    }

    public Index getIndexUtil() {
        return indexUtil;
    }

    public void setIndexUtil(Index indexUtil) {
        this.indexUtil = indexUtil;
    }

    public Double getInitialLinePerformance() {
        return initialLinePerformance;
    }

    public void setInitialLinePerformance(Double initialLinePerformance) {
        this.initialLinePerformance = initialLinePerformance;
    }

    public Double getAverageLinePerformance() {
        return averageLinePerformance;
    }

    public void setAverageLinePerformance(Double averageLinePerformance) {
        this.averageLinePerformance = averageLinePerformance;
    }
}


