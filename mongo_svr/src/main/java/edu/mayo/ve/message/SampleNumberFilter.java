package edu.mayo.ve.message;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 1/7/14
 * Time: 8:58 AM
 * A SampleNumberFilter (could also be called FormatNumberFilter) works to communicate in a general way
 * the state of the front end application to back-end queries on any of the format fields.  (very similar to InfoNumberFilter)
 * This interface replaces the following in the query object:
 * Double minAltReads = INFINITY;
 * Double maxAltReads = 0.0;
 // Show me only variants that are found in more than N samples
 * Double minNumSample = INFINITY;
 // Show me only variants that are found in fewer than N samples
 * Double maxNumSample = 0.0;
 * Double minAC = INFINITY;
 * Double maxAC = 0.0;
 * Double minPHRED = INFINITY;
 * It is far more general and allows filtering on ANY FIELD in the SAMPLES defined by FORMAT.
 *
 */
public class SampleNumberFilter {
    String minORmax = "max";// use min/max
    String key = "";    //e.g. "DP"
    Double value = 0.0;  //the value that we want to see at the key e.g. 1.2
    String comparator = ""; //use the following values:  http://docs.mongodb.org/manual/reference/operator/
    //$gt 	Matches values that are greater than the value specified in the query.
    //$gte 	Matches values that are equal to or greater than the value specified in the query.
    //$lt 	Matches values that are less than the value specified in the query.
    //$lte 	Matches values that are less than or equal to the value specified in the query.
    //$ne 	Matches all values that are not equal to the value specified in the query.
    boolean includeNulls = false; //documents that don't have the field are not returned by default

    public SampleNumberFilter(){
        init("max","",0.0,"", false);
    }

    public SampleNumberFilter(String minmax, String key, Double value, String comparator){
        init(minmax,key,value,comparator,false);
    }

    public SampleNumberFilter(String minmax, String key, Double value, String comparator, boolean includeNulls){
        init(minmax,key,value,comparator,includeNulls);
    }

    private void init(String minmax, String key, Double value, String comparator, boolean includeNulls){
        this.minORmax = minmax.toLowerCase();
        this.key = key;
        this.value = value;
        this.comparator = comparator;
        this.includeNulls = includeNulls;
    }

    public String getMinORmax() {
        return minORmax;
    }

    public void setMinORmax(String minORmax) {
        this.minORmax = minORmax;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public String getComparator() {
        return comparator;
    }

    public void setComparator(String comparator) {
        this.comparator = comparator;
    }

    public boolean isIncludeNulls() {
        return includeNulls;
    }

    public void setIncludeNulls(boolean includeNulls) {
        this.includeNulls = includeNulls;
    }
}
