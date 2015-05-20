package edu.mayo.ve.message;

/**
 * Created by m102417 on 5/15/15.
 *
 * This is for POS and QUAL
 */
public class FixedFieldNumberFilter {

    public FixedFieldNumberFilter(){

    }

    public FixedFieldNumberFilter(String key, Double value, String comparator, boolean includeNulls){
        this.key = key;
        this.value = value;
        this.comparator = comparator;
        this.includeNulls = includeNulls;
    }

    String key = "";              //e.g. "INFO.AC"
    Double value = 0.0;           //the value that we want to see at the key e.g. 1.2
    String comparator = "";       //use the following values:  http://docs.mongodb.org/manual/reference/operator/
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
