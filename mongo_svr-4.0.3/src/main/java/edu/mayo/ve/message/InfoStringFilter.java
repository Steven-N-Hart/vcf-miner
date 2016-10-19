package edu.mayo.ve.message;

import java.util.ArrayList;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 7/18/13
 * Time: 1:39 PM
 * To change this template use File | Settings | File Templates.
 */
public class InfoStringFilter {
    ArrayList<String> values = new ArrayList<String>(); //the value you want to compare to
    String key = "";    //e.g. "INFO.AC"
    String comparator = "$in";
    boolean includeNulls = false; //documents that don't have the field are not returned by default
    //$all 	Matches arrays that contain all elements specified in the query.
    //$in 	Matches any of the values that exist in an array specified in the query.
    //$ne 	Matches all values that are not equal to the value specified in the query.
    //$nin 	Matches values that do not exist in an array specified to the query.

    public InfoStringFilter(){

    }

    public InfoStringFilter(String key, ArrayList<String> values, String comparator, boolean includeNulls){
        this.key = key;
        this.values = values;
        this.comparator = comparator;
        this.includeNulls = includeNulls;
    }

    public ArrayList<String> getValues() {
        return values;
    }

    public void setValues(ArrayList<String> values) {
        this.values = values;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
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
