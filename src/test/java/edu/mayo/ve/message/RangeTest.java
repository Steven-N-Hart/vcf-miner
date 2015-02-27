package edu.mayo.ve.message;

import junit.framework.TestCase;
import org.junit.Test;

import java.text.ParseException;

public class RangeTest extends TestCase {


    @Test
    public void testParseRange() throws ParseException {
        Range r = null;
        r = new Range("CHR1:100-2000");
        assertEquals("CHR1", r.getChrom());
        assertEquals(100,r.getMinBP());
        assertEquals(2000,r.getMaxBP());
        r = new Range("1 100 2000");
        assertEquals("1", r.getChrom());
        assertEquals(100,r.getMinBP());
        assertEquals(2000,r.getMaxBP());
        r = new Range("1 100 2000 ANNOTATION1");
        assertEquals("1", r.getChrom());
        assertEquals(100,r.getMinBP());
        assertEquals(2000,r.getMaxBP());
        r = new Range("CHR1 : 100-2000");
        assertEquals("CHR1", r.getChrom());
        assertEquals(100,r.getMinBP());
        assertEquals(2000,r.getMaxBP());
    }

}