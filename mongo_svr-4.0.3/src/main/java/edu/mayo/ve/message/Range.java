package edu.mayo.ve.message;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import edu.mayo.ve.util.IOUtils;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
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
    	try {
	    	// Split by space, colon, dash, tab, or comma
	    	// NOTE: You can have any number of spaces around another delimiter (which is what the " *" is allowing),
	    	//       but two delimiters next to each other is treated as two columns (unless it is multiple spaces, which are allowed)
	    	String[] cols = s.split(" *[ :\\-\\\t,]{1} *");
	    	
	    	if(cols.length < 3) {
	            throw new ParseException("The following interval line is malformed (incorrect number of columns - minimum of 3 is required): " + s, 0);
	        }

    		this.chrom = cols[0];
            this.minBP = Integer.parseInt(cols[1]);
            this.maxBP = Integer.parseInt(cols[2]);
        } catch (Exception e){
            String err = "<k,v> landmark= " +  this.chrom + ", minBP=" + this.minBP + ", maxBP=" + this.maxBP;
            throw new ParseException("The following interval can not be converted to coordinates: " + s + "\n" + err + "\n" + e.toString(), 0);
        }
        return this;
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
    	// Do the numbered ranges overlap RANGE?
        //    1,2 -> NO
        //    3,4,5,6 ->YES
        BasicDBObject clauses = new BasicDBObject();
        clauses.append("CHROM", chrom);
        
        // formula:     e >= x AND s <= y
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
