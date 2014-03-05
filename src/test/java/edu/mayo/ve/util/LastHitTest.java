package edu.mayo.ve.util;

import com.mongodb.BasicDBList;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;


/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 1/6/14
 * Time: 10:48 AM
 * To change this template use File | Settings | File Templates.
 */
public class LastHitTest {
    String workspace = "workspace";
    String field = "field";

    @Before
    public void init(){
        this.resetLastHit();
    }

    @After
    public void resetLastHit(){
        lastHit = new LastHit("a","b","c",0,new BasicDBList()); //empty (otherwise we have to check for nulls)
    }


    @Test
    public void testCanSatisfyRequest() throws Exception {
        //first, we can't satisfy the request because we don't have the data
        assertFalse(lastHit.canSatisfyRequest(workspace, field, "a", 10));
        update1();
        //then we can satisfy the request
        assertTrue(lastHit.canSatisfyRequest(workspace,field,"a",10));
        //then we can satisfy a more granular request
        assertTrue(lastHit.canSatisfyRequest(workspace,field,"aa",10));
        //then we can't satisfy a different request
        assertFalse(lastHit.canSatisfyRequest(workspace, "otherfield", "a", 10));
        //and we can't satisfy a request where maxValues is ever greater
        assertFalse(lastHit.canSatisfyRequest(workspace,field,"a",20));
    }

    @Test
    public void testSatisfyRequest() throws Exception {
        BasicDBList expected = new BasicDBList();
        //satisfyRequest on improperly initialized values --returns empty list!
        assertDBListStringEquals(expected, lastHit.satisfyRequest("a",10)); //this call should be preceded by a can-satisfy to ensure workspace and field agree!
        update1();
        //update expected
        expected.add("a");
        assertDBListStringEquals(expected, lastHit.satisfyRequest("a",1));
        expected.add("aa");
        assertDBListStringEquals(expected, lastHit.satisfyRequest("a",2));
        expected.add("aaa");
        expected.add("ab");
        assertDBListStringEquals(expected, lastHit.satisfyRequest("a",10));
        BasicDBList expected2 = new BasicDBList();
        expected2.add("ab");
        assertDBListStringEquals(expected2, lastHit.satisfyRequest("ab",10));
        expected2.remove(0); //emptyList --
        assertDBListStringEquals(expected2, lastHit.satisfyRequest("abc",10));  //nothng returned!

    }

    public void assertDBListStringEquals(BasicDBList l1, BasicDBList l2){
        org.junit.Assert.assertEquals(l1.size(), l2.size());
        for(int i=0;i<l1.size();i++){
            String s1 = (String)l1.get(i);  //casting kinda sucks :(
            String s2 = (String)l2.get(i);
            assertEquals(s1,s2);
        }
    }

    LastHit lastHit = null;
    private void update1(){
        BasicDBList l = new BasicDBList();
        l.add("a");
        l.add("aa");
        l.add("aaa");
        l.add("ab");
        lastHit = new LastHit(workspace,field,"a",10,l);
    }
}
