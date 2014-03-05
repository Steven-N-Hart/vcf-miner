package edu.mayo.ve.message;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 7/18/13
 * Time: 9:29 AM
 * To change this template use File | Settings | File Templates.
 */
public class InfoNumberFilter {
    String key = "";    //e.g. "INFO.AC"
    Double value = 0.0;  //the value that we want to see at the key e.g. 1.2
    String comparator = ""; //use the following values:  http://docs.mongodb.org/manual/reference/operator/
    boolean includeNulls = false; //documents that don't have the field are not returned by default
    //$gt 	Matches values that are greater than the value specified in the query.
    //$gte 	Matches values that are equal to or greater than the value specified in the query.
    //$lt 	Matches values that are less than the value specified in the query.
    //$lte 	Matches values that are less than or equal to the value specified in the query.
    //$ne 	Matches all values that are not equal to the value specified in the query.


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
