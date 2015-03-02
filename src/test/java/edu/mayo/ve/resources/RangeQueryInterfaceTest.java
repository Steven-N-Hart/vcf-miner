package edu.mayo.ve.resources;

import junit.framework.TestCase;

import java.util.ArrayList;

public class RangeQueryInterfaceTest extends TestCase {

    public void testValidate() throws Exception {
        //this unit test, will only test the regex in testValidate, this way it need not connect to Mongo.  Testing that the workspace exists and the field is not in use
        //is covered by RangeITCase
        RangeQueryInterface rangeQ = new RangeQueryInterface();
        ArrayList<Boolean> passedTests = new ArrayList<Boolean>();
        String workspace = "foo";
        rangeQ.validate("abc123ABC", workspace); //works
        passedTests.add(true);
        try {
            rangeQ.validate("ab.c", workspace); //fails
        }catch(Exception e){
            //should get here
            passedTests.add(true);
        }
        rangeQ.validate("a_c", workspace); //fails
        passedTests.add(true);

        try {
            rangeQ.validate("ab#c", workspace); //fails
        }catch(Exception e){
            //should get here
            passedTests.add(true);
        }

        assertEquals(4, passedTests.size());

    }
}