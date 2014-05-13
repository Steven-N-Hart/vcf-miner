package edu.mayo.ve.message;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import edu.mayo.ve.resources.GeneQueries;


import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 6/21/13
 * Time: 1:53 PM
 */
public class Querry {

    public static final double INFINITY = Double.POSITIVE_INFINITY; //4294967295; //9007199254740992;  /--http://stackoverflow.com/questions/307179/what-is-javascripts-max-int-whats-the-highest-integer-value-a-number-can-go-t

    String workspace;
    Integer numberResults;
    Integer returnSampleInfo = 0; //1 for true
    ArrayList<SampleNumberFilter> customNumberFilters = new ArrayList<SampleNumberFilter>(); //customNumberFilters - these are number fields in the sample columns that have special logic applied to them
    ArrayList<SampleNumberFilter> sampleNumberFilters = new ArrayList<SampleNumberFilter>();
    ArrayList<String> genes = new ArrayList<String>();  //this probably should be depricated at this point
    ArrayList<SampleGroup> sampleGroups = new ArrayList<SampleGroup>();
    ArrayList<InfoNumberFilter> infoNumberFilters = new ArrayList<InfoNumberFilter>();
    ArrayList<InfoStringFilter> infoStringFilters = new ArrayList<InfoStringFilter>();
    ArrayList<InfoFlagFilter> infoFlagFilters = new ArrayList<InfoFlagFilter>();

    public DBObject createQuery(){
        ArrayList<String> filters = whatFilters();
        //there is no filters applied, just return the BasicDBObject.
        if(filters.size() == 0){
              return  new BasicDBObject();
        }
        //There is only one filter, create a basic query based on that
        if(filters.size() == 1){
              return getQuery4Filter(filters.get(0));
        }
        //if there is more than one filter, we need to construct a conjoined query (using an AND)
        return getConjoinedQuery(filters);

    }

    private DBObject getConjoinedQuery(ArrayList<String> filters) {
        DBObject r = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        for( String f : filters){
            l.add(this.getQuery4Filter(f));
        }
        r.put("$and",l);
        return r;  //To change body of created methods use File | Settings | File Templates.
    }

    public enum filters {
              MINALTREADSFILTER,
              MAXALTREADSFILTER,
              MINSAMPLEFILTER,
              MAXSAMPLEFILTER,
              MAXACFILTER,
              MINACFILTER,
              PHREDFILTER,
              GENESFILTER,
              GROUPFILTER,
              INFONUMBERFILTER,
              INFOSTRINGFILTER,
              INFOFLAGFILTER,
              SAMPLENUMBERFILTER,
              CUSTOMNUMBERFILTER
    }
    /**
     * A query has a collection of filters based on the status of the Querry object.  For example if:
     *     minAltReads != Infinity AND
     *     maxNumSample != 0 AND
     *     maxAC != 0
     *
     *     Then our query contains 3 filters.
     *     Counting the number of filters is important because the logic for composing the Mongo Query is different if there is 0, 1 or 2+ filters in the query
     * @return
     */
    public ArrayList<String> whatFilters(){
        ArrayList<String> l = new ArrayList<String>();
//depricated
//        if(minAltReads != INFINITY){
//           l.add(filters.MINALTREADSFILTER.toString());
//        }
//        if(maxAltReads != 0){
//            l.add(filters.MAXALTREADSFILTER.toString());
//        }
//        if(minNumSample != INFINITY ){
//            l.add(filters.MINSAMPLEFILTER.toString());
//        }
//        if(maxNumSample != 0.0){
//            l.add(filters.MAXSAMPLEFILTER.toString());
//        }
//        if(minAC != INFINITY ){
//            l.add(filters.MINACFILTER.toString());
//        }
//        if( maxAC != 0.0){
//            l.add(filters.MAXACFILTER.toString());
//        }
//        if(minPHRED != INFINITY){
//            l.add(filters.PHREDFILTER.toString());
//        }
        if(this.sampleNumberFilters.size() > 0){
            l.add(filters.SAMPLENUMBERFILTER.toString());
        }
        if(this.customNumberFilters.size() > 0){
            l.add(filters.CUSTOMNUMBERFILTER.toString());
        }
        if(this.getGenes().size() > 0){
            l.add(filters.GENESFILTER.toString());
        }
        if(this.getSampleGroups().size() > 0){
            l.add(filters.GROUPFILTER.toString());
        }
        if(this.infoNumberFilters.size() > 0){
            l.add(filters.INFONUMBERFILTER.toString());
        }
        if(this.infoStringFilters.size() > 0){
            l.add(filters.INFOSTRINGFILTER.toString());
        }
        if(this.infoFlagFilters.size() > 0){
            l.add(filters.INFOFLAGFILTER.toString());
        }
        return l;
    }

    /**
     * Given a filter, construct the query for that filter and return it
     *
     * @param f - a value from the enum above
     * @return a DBObject that can be used directly in the MongoDB Query
     */
    public DBObject getQuery4Filter(String f){
        if(f.equalsIgnoreCase(filters.GENESFILTER.toString())){
            return constructGeneQuery();
        }
        if(f.equalsIgnoreCase(filters.GROUPFILTER.toString())){
            return this.constructGroupFilters();
        }
        if(f.equalsIgnoreCase(filters.INFONUMBERFILTER.toString())){
            return this.constructInfoNumberFilters();
        }
        if(f.equalsIgnoreCase(filters.INFOSTRINGFILTER.toString())){
            return this.constructInfoStringFilters();
        }
        if(f.equalsIgnoreCase(filters.INFOFLAGFILTER.toString())){
            return this.constructInfoFlagFilters();
        }
        if(f.equalsIgnoreCase(filters.SAMPLENUMBERFILTER.toString())){
            return this.constructSampleNumberFilters("FORMAT", this.sampleNumberFilters);
        }
        if(f.equalsIgnoreCase(filters.CUSTOMNUMBERFILTER.toString())){
            return this.constructSampleNumberFilters("CUSTOM", this.customNumberFilters);
        }
        return null;
    }

    /**
     * Method for constructing basic query objects based on booleans
     * @param field
     * @param trueFalse
     * @return
     */
    private DBObject constructBasicFilter(String field, boolean trueFalse){
        BasicDBObject q = new BasicDBObject(field, trueFalse);
        return q;
    }

    /**
     * Method for constructing basic query where we expect the query objects be true or null (e.g. not inserted
     */
    private DBObject constructBasicFilterNull(String field, boolean trueNull){
        if(trueNull == false){
            //what we actually want is null
            BasicDBObject q = new BasicDBObject(field, null);
            return q;
        }else {
            return constructBasicFilter(field, true);
        }
    }

    /**
     * Method for constructing basic query objects based on strings
     * @param field
     * @param value
     * @return
     */
    private DBObject constructBasicFilter(String field, String value){
        BasicDBObject q = new BasicDBObject();
        q.append(field, value);
        return q;
    }

    /**
     * a handy interface to create query objects of the form:   db.<workspace>.find({"field":{operator:value}})
     * e.g. db.wf1c80c3721da2e536a53f16b4bc47aca7ef6e681.find({"GenotypePostitiveCount":{$lte:2}})
     * @param field          - they key/identifier we wish to query
     * @param lessOrGreater  - the operator we wish to use e.g. $lte, $gte, $gt, $lt, ...
     *                         note, if you pass nothing for operator the syntax constructed will differ slightly and equality will be the operator
     *                         e.g. db.<workspace>.find({"field":value})
     * @param value          - the value we will be comparing against
     * @return
     */
    private DBObject constructBasicFilter(String field, String lessOrGreater, Double value){
        if(lessOrGreater.length() < 1){
            BasicDBObject q = new BasicDBObject();
            q.append(field, value);
            return q;
        }else {
            BasicDBObject q = new BasicDBObject();
            BasicDBObject compare = new BasicDBObject();
            compare.append(lessOrGreater,value);
            q.append(field, compare);
            return q;
        }
    }

    /**
     * works exactly like constructBasicFilter, but will $or it with a null query if includeNulls is true
     * @param field
     * @param lessOrGreater
     * @param value
     * @param includeNulls
     * @return
     */
    private DBObject constructBasicFilterWithNulls(String field, String lessOrGreater, Double value, boolean includeNulls){
        if(includeNulls){
            DBObject q = constructBasicFilter(field, lessOrGreater, value);
            BasicDBList orList = new BasicDBList();
            orList.add(q);
            BasicDBObject nulls = new BasicDBObject();
            nulls.append(field, null);
            orList.add(nulls);
            BasicDBObject ret = new BasicDBObject();
            ret.append("$or", orList);
            return ret;
        }else {
            return constructBasicFilter(field, lessOrGreater, value);
        }
    }

//depricated
//    private DBObject constructACFilter(String lessOrGreater, Double value){
//        BasicDBObject q = new BasicDBObject();
//        BasicDBObject compare = new BasicDBObject();
//        compare.append(lessOrGreater,value);
//        q.append("INFO.AC", compare);
//        return q;
//    }

    /**
     * A min sample query works as follows:
     * db.<workspace>.find({"GenotypePostitiveCount":{$lte:N}})
     * e.g.
     * db.wf1c80c3721da2e536a53f16b4bc47aca7ef6e681.find({"GenotypePostitiveCount":{$lte:2}})
     *
     * @return
     */
    private DBObject constructSampleFilter(String lessOrGreater, Double value){
        BasicDBObject q = new BasicDBObject();
        BasicDBObject compare = new BasicDBObject();
        compare.append(lessOrGreater,value);
        q.append("GenotypePostitiveCount", compare);
        return q;
    }

//depricated
//    /**
//     *  Given a value X, for the phred score,
//     *  conformation from Steve: the minPL score is not useful, because it is always going to have zero values,
//     *  so minPHRED means the
//     * @return   {"samples.maxPL":{$gte:X }}
//     */
//    private DBObject constructPhredFilter(){
//        BasicDBObject q = new BasicDBObject();
//        BasicDBObject compare = new BasicDBObject();
//        compare.append("$gte",this.minPHRED);
//        q.append("samples.maxPL", compare);
//        return q;
//    }
    /**
     * filters the fields in the documents returned by Mongo e.g. sample cols are large, so perhaps we don't want to send all that over the wire.
     * @return
     */
    public BasicDBObject getReturnSelect(){
        BasicDBObject q = new BasicDBObject();
        if(this.returnSampleInfo == 0){
            q.append("CHROM",1);
            q.append("POS",1);
            q.append("ID",1);
            q.append("REF",1);
            q.append("ALT",1);
            q.append("QUAL",1);
            q.append("FILTER",1);
            q.append("INFO",1);
            q.append("FORMAT",1);
            q.append("CUSTOM",1);
//            q.append("GenotypePostitiveCount",1);
//            q.append("GenotypePositiveList",1);
//            q.append("PLIntervalMin",1);
//            q.append("PLIntervalMax",1);
//            q.append("ADIntervalMin",1);
//            q.append("ADIntervalMax",1);
            return q;
        }else return q;
    }

    //this object is just used to call this function...
    private static GeneQueries geneQueries = new GeneQueries();
    private BasicDBObject constructGeneQuery(){
        return geneQueries.constructGeneQuery(this);
    }

    /**
     * constructSampleNumberFilters builds queries that will search structures that look like this:
     *
     *
     "FORMAT" : {
        "max" : {
            "lSC" : 52,
            "INS" : 1,
            "nSC" : 9,
            "NOV_INS" : 15,
            "CTX" : 0,
            "uRP" : 15,
            "TDUP" : 2,
            "INV" : 0,
            "DEL" : 0,
            "distl_levD" : 0.42
        },
        "min" : {
            "lSC" : 52,
            "INS" : 1,
            "nSC" : 9,
            "NOV_INS" : 15,
            "CTX" : 0,
            "uRP" : 15,
            "TDUP" : 2,
            "INV" : 0,
            "DEL" : 0,
            "distl_levD" : 0.42
        },
        "GenotypePostitiveCount" : 1,
        "GenotypePositiveList" : [
                "NA12878.chr1.vcf"
        ]
     }

     *
     * @param subdocumentField = FORMAT, CUSTOM....
     * @param numberFilters = this.sampleNumberFilters, this.customNumberFilters....
     * @return
     */
    private DBObject constructSampleNumberFilters(String subdocumentField, List<SampleNumberFilter> numberFilters){
        if(numberFilters.size() == 1){
            SampleNumberFilter snf = numberFilters.get(0);
            return constructBasicFilterWithNulls(getNumberFilterKey(subdocumentField,snf), snf.getComparator(), snf.getValue(), snf.includeNulls);
        } else {
            BasicDBObject composite = new BasicDBObject();
            BasicDBList lcomposite = new BasicDBList();
            for(SampleNumberFilter snf : sampleNumberFilters){
                lcomposite.add(constructBasicFilterWithNulls(getNumberFilterKey(subdocumentField,snf), snf.getComparator(), snf.getValue(), snf.includeNulls));
            }
            composite.put("$and", lcomposite);
            return composite;
        }
    }

    /**
     * @param subdocument - where in the document in the variant collection is this data going to be found (e.g. FORMAT, CUSTOM)
     * @param snf
     * @return a string like FORMAT.min.lSC
     */
    private String getNumberFilterKey(String subdocument, SampleNumberFilter snf){
        StringBuilder key = new StringBuilder();
        key.append(subdocument);
        key.append(".");
        key.append(snf.getMinORmax().toLowerCase());
        key.append(".");
        key.append(snf.getKey());
        return key.toString();
    }

    private DBObject constructInfoNumberFilters(){
        if(this.infoNumberFilters.size() == 1){
            InfoNumberFilter inf = infoNumberFilters.get(0);
            return constructBasicFilterWithNulls(formatInfoKey(inf.getKey()), inf.getComparator(), inf.getValue(), inf.includeNulls);
        }else {
            BasicDBObject composite = new BasicDBObject();
            BasicDBList lcomposite = new BasicDBList();
            for(InfoNumberFilter inf : infoNumberFilters){
                lcomposite.add(constructBasicFilterWithNulls(formatInfoKey(inf.getKey()), inf.getComparator(), inf.getValue(), inf.includeNulls));
            }
            composite.put("$and", lcomposite);
            return composite;
        }
    }

    private DBObject constructInfoFlagFilters(){
        if(this.infoFlagFilters.size() == 1){
            InfoFlagFilter iff = infoFlagFilters.get(0);
            return constructBasicFilterNull(formatInfoKey(iff.getKey()), iff.value);
        }else {
            BasicDBObject composite = new BasicDBObject();
            BasicDBList lcomposite = new BasicDBList();
            for(InfoFlagFilter iff : infoFlagFilters){
                lcomposite.add(constructBasicFilterNull(formatInfoKey(iff.key), iff.value));
            }
            composite.put("$and", lcomposite);
            return composite;
        }
    }


    private DBObject constructInfoStringFilters(){
        if(this.infoStringFilters.size() == 1){
            InfoStringFilter isf = infoStringFilters.get(0);
            return constructInfoStringFilter(isf.key, isf.comparator, isf.values, isf.includeNulls);
        }else {
            BasicDBObject composite = new BasicDBObject();
            BasicDBList lcomposite = new BasicDBList();
            for(InfoStringFilter isf : infoStringFilters){
                lcomposite.add(constructInfoStringFilter(isf.key, isf.comparator, isf.values, isf.includeNulls));
            }
            composite.put("$and", lcomposite);
            return composite;
        }
    }

    private String formatInfoKey(String key){
        String ret = key;
        if(!key.startsWith("INFO.")){
            ret = "INFO." + key;
        }
        return ret;
    }

    private DBObject constructInfoStringFilter(String key, String comparitor, ArrayList<String> values, boolean includeNulls){
            key = formatInfoKey(key);
            BasicDBObject q = new BasicDBObject();
            BasicDBObject compare = new BasicDBObject();
            BasicDBList l = new BasicDBList();
            for(String s: values){
                 l.add(s);
            }
            compare.append(comparitor, l);
            q.append(key, compare);
            if(includeNulls){
                BasicDBList orList = new BasicDBList();
                orList.add(q);
                BasicDBObject getNulls = new BasicDBObject();
                getNulls.put(key, null);
                orList.add(getNulls);
                BasicDBObject ret = new BasicDBObject();
                ret.put("$or", orList);
                return ret;
            }else {
                return q;
            }
    }


    private BasicDBObject constructGroupFilters(){
        if(this.getSampleGroups().size() == 1){
            //return the simple group query with only one group
            return constructGroupFilter(this.sampleGroups.get(0));
        }else {
            //multiple groups exist, we need to make a composite between them
            BasicDBObject composite = new BasicDBObject();
            BasicDBList lcomposite = new BasicDBList();
            for(SampleGroup sg : sampleGroups){
                lcomposite.add(constructGroupFilter(sg));
            }
            composite.put("$and", lcomposite);
            return composite;
        }
    }

    /**
     * constructs a filter that looks like this:
     * { "GenotypePositiveList": { $in : [ "s_Mayo_TN_CC_05" , "s_Mayo_TN_CC_06"] } } ]})
     * or (in the case of negatives:
     * { "GenotypePositiveList": { $nin : [ "s_Mayo_TN_CC_05" , "s_Mayo_TN_CC_06"] } } ]})
     *
     * @param sampleGroup
     * @return
     */
    private BasicDBObject constructGroupFilter(SampleGroup sampleGroup){
        if(sampleGroup.getAllAnySample().equalsIgnoreCase("ALL")){
            return constructANDGroupFilter(sampleGroup);
        }else {
            return constructGroupFilterSimple(sampleGroup);
        }
    }

    /**
     * constructs a query like this:
     * { $and : [{"FORMAT.HeterozygousList" : { $in : ["Y"] } }, {"FORMAT.HeterozygousList" : { $in : ["A"] } }] }";
     * @param sampleGroup
     * @return
     */
    private BasicDBObject constructANDGroupFilter(SampleGroup sampleGroup){
        BasicDBObject and = new BasicDBObject();
        BasicDBList andlist = new BasicDBList();
        for(String s : sampleGroup.getSamples()){
            DBObject andclause = constructANDClause(s, sampleGroup.getZygosity(), sampleGroup.isInSample());
            if(andclause != null){
                andlist.add(andclause);
            }
        }
        and.put("$and", andlist);
        return and;
    }

    private BasicDBObject constructANDClause(String sample, String zygocity, boolean inSample){
        BasicDBObject clause = new BasicDBObject();
        BasicDBObject in = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        l.add(sample);
        if(inSample){
            in.append("$in",l);
        }else {
            in.append("$nin",l);
        }
        clause.append(getSearchFormatArray(zygocity), in);
        return clause;
    }

    public BasicDBObject constructGroupFilterSimple(SampleGroup sampleGroup){
        BasicDBObject ret = new BasicDBObject();
        BasicDBObject in = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        for(String s : sampleGroup.getSamples()){
            l.add(s);
        }
        if(sampleGroup.inSample){
            in.append("$in",l);
        }else {
            in.append("$nin",l);
        }
        ret.append(getSearchFormatArray(sampleGroup), in);
        return ret;
    }

    public String getSearchFormatArray(SampleGroup sampleGroup){
        return getSearchFormatArray(sampleGroup.getZygosity());
    }

    public String getSearchFormatArray(String zygocity){
        if(zygocity.equalsIgnoreCase("heterozygous")){
            return "FORMAT.HeterozygousList";
        }else if(zygocity.equalsIgnoreCase("homozygous")){
            return "FORMAT.HomozygousList";
        } else {
            return "FORMAT.GenotypePositiveList";
        }
    }

    //db.<workspace>.find( {$and:[  {"samples":{$elemMatch:{GenotypePositive:1,sampleID:"X"}}}, {"samples":{$elemMatch:{GenotypePositive:{$ne:1},sampleID:"Y"}}}]}   ).pretty()
    private BasicDBObject constructGroupFilterLegacy(SampleGroup sampleGroup){
        BasicDBObject ret = new BasicDBObject();
        BasicDBList l = new BasicDBList();

        for(String s : sampleGroup.getSamples()){
            BasicDBObject j = sampleQ(s, sampleGroup.inSample);  //{GenotypePositive:1,sampleID:"X"}
            BasicDBObject i = new BasicDBObject();
            i.put("$elemMatch", j);                        //{$elemMatch:{GenotypePositive:1,sampleID:"X"}}
            BasicDBObject k = new BasicDBObject();
            k.put("samples", i);                           //{"samples":{$elemMatch:{GenotypePositive:1,sampleID:"X"}}}
            l.add(k);                                      //[  {"samples":{$elemMatch:{GenotypePositive:1,sampleID:"X"}}}, {"samples":{$elemMatch:{GenotypePositive:1,sampleID:"Y"}}}, ...  ]
        }
        ret.put("$or",l);
        return ret;
    }

    /**
     *
     * @param sname   name of a sample
     * @param inGroup   true if you want {GenotypePositive:1,sampleID:"X"} false, you get {GenotypePositive:{$ne:1}
     * @return  a sample based subquery as shown above to go in the $elemMatch clause
     */
    public BasicDBObject sampleQ(String sname, boolean inGroup){
        BasicDBObject q = new BasicDBObject();
        q.put("sampleID", sname);
        if(inGroup){
            q.put("GenotypePositive",1);
        }else {
            BasicDBObject ne = new BasicDBObject();
            ne.put("$ne", 1);
            q.put("GenotypePositive", ne);
        }
        return q;
    }

    public Integer getNumberResults() {
        return numberResults;
    }

    public void setNumberResults(Integer numberResults) {
        this.numberResults = numberResults;
    }

    public ArrayList<SampleNumberFilter> getSampleNumberFilters() {
        return sampleNumberFilters;
    }

    public void setSampleNumberFilters(ArrayList<SampleNumberFilter> sampleNumberFilters) {
        this.sampleNumberFilters = sampleNumberFilters;
    }

    public String getWorkspace() {
        return workspace;
    }

    public void setWorkspace(String workspace) {
        this.workspace = workspace;
    }

    public ArrayList<String> getGenes() {
        return genes;
    }

    public void setGenes(ArrayList<String> genes) {
        this.genes = genes;
    }

    public ArrayList<SampleGroup> getSampleGroups() {
        return sampleGroups;
    }

    public void setSampleGroups(ArrayList<SampleGroup> sampleGroups) {
        this.sampleGroups = sampleGroups;
    }

    public void setSampleGroups(List<SampleGroup> sampleGroupList){
        ArrayList<SampleGroup> rep = new ArrayList<SampleGroup>();
        for(SampleGroup samp : sampleGroupList){
            rep.add(samp);
        }
        this.sampleGroups = rep;
    }

    public ArrayList<InfoNumberFilter> getInfoNumberFilters() {
        return infoNumberFilters;
    }

    public void setInfoNumberFilters(ArrayList<InfoNumberFilter> infoNumberFilters) {
        this.infoNumberFilters = infoNumberFilters;
    }

    public ArrayList<InfoStringFilter> getInfoStringFilters() {
        return infoStringFilters;
    }

    public void setInfoStringFilters(ArrayList<InfoStringFilter> infoStringFilters) {
        this.infoStringFilters = infoStringFilters;
    }

    public ArrayList<InfoFlagFilter> getInfoFlagFilters() {
        return infoFlagFilters;
    }

    public void setInfoFlagFilters(ArrayList<InfoFlagFilter> infoFlagFilters) {
        this.infoFlagFilters = infoFlagFilters;
    }

    public ArrayList<SampleNumberFilter> getCustomNumberFilters() {
        return customNumberFilters;
    }

    public void setCustomNumberFilters(ArrayList<SampleNumberFilter> customNumberFilters) {
        this.customNumberFilters = customNumberFilters;
    }
}
