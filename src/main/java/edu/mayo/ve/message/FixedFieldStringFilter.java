package edu.mayo.ve.message;

import java.util.ArrayList;

/**
 * Created by m102417 on 5/14/15.
 * This filter enables the user to query the following 'fixed' fields from the VCF:
 * CHROM
 * ID
 * REF
 * ALT
 * FILTER
 *
 * POS and QUAL are handed byt the FixedFieldNumberFilter!
 */
public class FixedFieldStringFilter {
    ArrayList<String> values = new ArrayList<String>();      //the value you want to compare to (currently everything in mongodb is stored as a string... is this a problem for these queries?)
    private String name;                                //the name of the field we wish to query e.g. CHROM, POS, ID, REF, ALT, QUAL, FILTER
    private String operator;                            //the operator we wish to use on this field use: http://docs.mongodb.org/manual/reference/operator/
    boolean includeNulls = false;                       //documents that don't have the field are not returned by default


    public FixedFieldStringFilter(){

    }

    public FixedFieldStringFilter(String name, String operator, ArrayList<String> values, boolean includeNulls){
        this.name = name;
        this.operator = operator;
        this.values = values;
        this.includeNulls = includeNulls;
    }

    public ArrayList<String> getValues() {
        return values;
    }

    public void setValues(ArrayList<String> values) {
        this.values = values;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public boolean isIncludeNulls() {
        return includeNulls;
    }

    public void setIncludeNulls(boolean includeNulls) {
        this.includeNulls = includeNulls;
    }
}
