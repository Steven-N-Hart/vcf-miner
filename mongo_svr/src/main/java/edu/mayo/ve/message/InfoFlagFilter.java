package edu.mayo.ve.message;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 10/28/13
 * Time: 1:41 PM
 * To change this template use File | Settings | File Templates.
 */
public class InfoFlagFilter {
    String key = "";       //e.g. "INFO.FOO"  -- whatever the flag value is
    boolean value = true;  //if we expect the flag to be true or false.

    public InfoFlagFilter(){

    }

    public InfoFlagFilter(String key, boolean value){
        this.key = key;
        this.value = value;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public boolean isValue() {
        return value;
    }

    public void setValue(boolean value) {
        this.value = value;
    }
}
