package edu.mayo.ve.message;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

/**
 * Created by m102417 on 2/6/15.
 */
public class Range {
    String chrom = "";  //the chromosome or plasmid
    long minBP = 0;     //minimum position
    long maxBP = 0;     //maximum position

    public Range(){

    }

    /**
     * Takes a Range Query/bed representation of a genomic range and converts it to a range object.
     * @param range
     */
    public Range(String range) throws ParseException {
        this.parseRange(range);
    }


    /**
     * takes input of the following form and generates a range object
     *
     CHR1:100-2000
     1 100 2000
     1 100 2000 ANNOTATION1
     CHR1 : 100-2000
     * @param s
     * @return
     */
    public Range parseRange(String s) throws ParseException {
        Range r = new Range();
        String c;
        List<String> tokens = new ArrayList<String>();
        s = s.trim(); //trim off leading and trailing spaces
        ArrayList<Integer> dataPos = new ArrayList<Integer>();
        dataPos.add(0);
        for(int i=1; i<s.length(); i++){
            if(s.charAt(i) == ' ' || s.charAt(i) == ':' || s.charAt(i) == '-' || s.charAt(i) == '\t' || s.charAt(i) == ',' ) {
                //gaps we don't care
            }else {
                //data
                dataPos.add(i);
            }
        }
        boolean covered = true;
        boolean prev = true; //the previous state for covered
        LinkedList<Integer> stateChanges = new LinkedList<Integer>();
        stateChanges.add(0);
        for(int i=0; i<s.length(); i++){
            prev = covered;
            if(dataPos.contains(i)){
                covered=true;
            }else {
                covered=false;
            }
            //if we change the state from covered to uncovered or uncovered to covered
            if(prev != covered){
                stateChanges.add(i);
            }

        }
        int start = 0;
        int end = 0;
        for(int i =1; i< stateChanges.size(); i++){
            tokens.add(s.substring(stateChanges.get(i - 1),stateChanges.get(i)));
        }
        tokens.add(s.substring(stateChanges.get(stateChanges.size()-1)));
        if(tokens.size() < 3){
            throw new ParseException("The following interval line is malformed (incorrect number of tokens): " + s, 0);
        }
        Integer minBP = null;
        Integer maxBP = null;
        String landmark = null;
        try {
            landmark = tokens.get(0);
            minBP = Integer.parseInt(tokens.get(2));
            maxBP = Integer.parseInt(tokens.get(4));
            this.chrom = landmark;
            this.minBP = minBP;
            this.maxBP = maxBP;
        } catch (Exception e){
            String err = "<k,v> landmark= " +  landmark + ", minBP=" + minBP + ", maxBP=" + maxBP;
            throw new ParseException("The following interval can not be converted to coordinates: " + s + " :: " + err, 0);
        }
        return r;
    }

    //todo: write a method that converts this into a mongodb object (ideally for upsert) - http://docs.mongodb.org/manual/reference/method/db.collection.update/#multi-parameter

    /**
     * this method  will create a dbobject to query the database for records that overlap this range.
     * @return
     */
    public DBObject createQueryFromRange(){
        //  1. s-------e
        //  2.                                 s-------e
        //  3.                s-------e
        //  4.      s-------e
        //  5.                         s-------e
        //  6.        s----------------------e
        //RANGE:           x===============y
        //1,2 -> NO
        //3,4,5,6 ->YES
        BasicDBObject clauses = new BasicDBObject();
        clauses.append("CHROM", chrom);
        //formula:     e >= x AND s <= y
        BasicDBObject gte = new BasicDBObject();
        gte.append("$gte", minBP); //minBP = x
        clauses.append("_minBP", gte);
        BasicDBObject lte = new BasicDBObject();
        lte.append("$lte", maxBP); //maxBP = y
        clauses.append("_maxBP", lte);
        return clauses;
    }

    public String getChrom() {
        return chrom;
    }

    public void setChrom(String chrom) {
        this.chrom = chrom;
    }

    public long getMinBP() {
        return minBP;
    }

    public void setMinBP(long minBP) {
        this.minBP = minBP;
    }

    public long getMaxBP() {
        return maxBP;
    }

    public void setMaxBP(long maxBP) {
        this.maxBP = maxBP;
    }

}
