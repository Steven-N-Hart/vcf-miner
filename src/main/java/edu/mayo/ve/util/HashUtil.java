/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.util;

import java.io.UnsupportedEncodingException; 
import java.security.MessageDigest; 
import java.security.NoSuchAlgorithmException; 
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 *
 */
public class HashUtil { 
 
    private static String convertToHex(byte[] data) { 
        StringBuffer buf = new StringBuffer();
        for (int i = 0; i < data.length; i++) { 
            int halfbyte = (data[i] >>> 4) & 0x0F;
            int two_halfs = 0;
            do { 
                if ((0 <= halfbyte) && (halfbyte <= 9)) 
                    buf.append((char) ('0' + halfbyte));
                else 
                    buf.append((char) ('a' + (halfbyte - 10)));
                halfbyte = data[i] & 0x0F;
            } while(two_halfs++ < 1);
        } 
        return buf.toString();
    } 
 
    public static String SHA1(String text) 
    throws NoSuchAlgorithmException, UnsupportedEncodingException  { 
        MessageDigest md;
        md = MessageDigest.getInstance("SHA-1");//or md5 whatever...
        byte[] sha1hash = new byte[40];
        md.update(text.getBytes("iso-8859-1"), 0, text.length());
        sha1hash = md.digest();
        return convertToHex(sha1hash);
    } 
    
    public static String randcat(String text){
        return text + new Double(Math.random()).toString();
    }
    
    public static void main(String[] args){
        try {
            System.out.println( SHA1("hello there!") );          //75b2ea46404ca4d043d9592dc313b3a28fde41a9
            System.out.println( SHA1(randcat("hello there!")) ); //96988172ce7b021fe03995c5fc3f9a4807e22b46
            
        } catch (NoSuchAlgorithmException ex) {
            Logger.getLogger(HashUtil.class.getName()).log(Level.SEVERE, null, ex);
        } catch (UnsupportedEncodingException ex) {
            Logger.getLogger(HashUtil.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
} 