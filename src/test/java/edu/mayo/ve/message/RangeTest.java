package edu.mayo.ve.message;

import junit.framework.TestCase;
import org.junit.Test;

import java.text.ParseException;

public class RangeTest extends TestCase {


    @Test
    public void testParseRange() throws ParseException {
    	assertTrue( isValid("CHR1:100-2000", 			"CHR1", 	100, 	2000) );
    	assertTrue( isValid("1 100 2000",    			"1", 		100, 	2000) );
    	assertTrue( isValid("1 100 2000 ANNOTATION1",	"1",		100,	2000) );
    	assertTrue( isValid("CHR1 : 100-2000",			"CHR1",		100,	2000) );
    	assertTrue( isValid("CHR1 : 100 - 2000",		"CHR1",		100,	2000) );
    	assertTrue( isValid("chr22:14-15 a b c d e f g","chr22",	14,		15) );
    	assertTrue( isValid("22:15-16 a b c d",			"22",		15,		16) );
    	assertTrue( isValid("22,17,18",					"22",		17, 	18) );
    	assertTrue( isValid("22:18 19",					"22",		18, 	19) );
    	assertTrue( isValid("M:18 19",					"M",		18, 	19) );
    	assertTrue( isValid("X\t18\t19",				"X",		18, 	19) );
    	assertTrue( isValid("X\t 18 \t 19",				"X",		18, 	19) );
    	assertTrue( isValid("22:16050400 16050410",		"22",		16050400,16050410) );
    	assertTrue( isValid("22:16050410,16050500",		"22",		16050410,16050500) );
    	// Allow multiple spaces and multiple spaces around delimiters
    	assertTrue( isValid("22 :100: 200",				"22",		100,	200) );
    	assertTrue( isValid("22 : 100  200",			"22",		100,	200) );
    	assertTrue( isValid("22  :100   200",			"22",		100,	200) );
    	assertTrue( isValid("22:  100  -  200",			"22",		100,	200) );
    	assertTrue( isValid("22   100   200",			"22",		100,	200) );
    	
    	// =========================================================================
    	// BAD cases
    	// =========================================================================
        // Null or too short
    	assertFalse(isValid(null,						null,		-1,		-1) );
    	assertFalse(isValid("",							"",			-1,		-1) );
    	assertFalse(isValid("1",						"1",		-1,		-1) );
    	assertFalse(isValid("1\t100",					"1",		100,	-1) );
    	// Character in the max position column (3rd)
    	assertFalse(isValid("chr22:100,a",				"chr22",	100,	-1) );
    	assertFalse(isValid("X,1,b",					"X",		1,		-1) );
    	// Two delimiters next to each other (except for spaces) will be treated as separate columns
    	assertFalse(isValid("X,,1,2,a,b,c",				"X",		1,		2) );
    	assertFalse(isValid("X\t1\t\t2\t3\t4\t5",		"X",		1,		2) );
    	// Fail where any one of the expected strings or column values does not match
    	assertFalse(isValid("chr1 1000-2000",			"X",		1000,	2000) );
    	assertFalse(isValid("chr1 1000-2000",			"chr1",		1001,	2000) );
    	assertFalse(isValid("chr1 1000-2000",			"chr1",		1000,	2001) );
    	assertFalse(isValid("chr1 1000-2000",			"X",		-1,		-1) );
    }

    /** Verify that the Range can be parsed, and that it matches the expected chrom, min, max */
    private boolean isValid(String rangeToParse, String expectedChrom, long expectedMin, long expectedMax) {
    	try {
    		Range range = new Range(rangeToParse);
    		return  range.chrom.equals(expectedChrom)  &&  range.minBP == expectedMin  &&  range.maxBP == expectedMax;
    	} catch(Exception e) {
    		return false;
    	}
    }
}