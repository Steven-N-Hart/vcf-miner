/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.util;

/**
 *
 * @author Daniel Quest
 * 
 * MongoDB does not accept some strings, so we need a central place to make sure that
 * strings are fixed before going to the database and then reverted before coming back to the user
 */
public class FixStrings {
    public static final String dot = "<dot>";
    public static final String dollar = "<dollar>";
    public static final String tilda = "<tilda>";
    public static final String backslash = "<backslash>";
    public static final String singlequote = "<singlequote>";
    public static final String doublequote = "<doublequote>";
    
    public static String usr2mongo(String s){
        String r = s.replaceAll("\\.", dot);
        r =  r.replaceAll("\\$", dollar);
//        r = r.replaceAll("~", tilda);
//        r = r.replaceAll("\\", backslash);       
//        r = r.replaceAll("'", singlequote);
//        r = r.replaceAll("\"", doublequote);
//        if(r.startsWith(doublequote)) r = r.replaceFirst(doublequote, "\"");
//        if(r.matches(doublequote + "$")) r = r.replaceAll(doublequote + "$", "\"");
        return r;
    }
    
    public static String mongo2usr(String s){
        String r = s.replaceAll(dot, "\\.");
        r = r.replaceAll(dollar, "\\$");
//        r = r.replaceAll(tilda, "~");
//        r = r.replaceAll(backslash, "\\");
//        r = r.replaceAll(singlequote, "'");
//        r = r.replaceAll(doublequote, "\"");
        return r;
    }
    
}
