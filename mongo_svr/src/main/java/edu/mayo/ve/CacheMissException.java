package edu.mayo.ve;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 1/2/14
 * Time: 9:55 AM
 * To change this template use File | Settings | File Templates.
 */
public class CacheMissException extends Exception {
    public CacheMissException(String message){
        super(message);
    }
}
