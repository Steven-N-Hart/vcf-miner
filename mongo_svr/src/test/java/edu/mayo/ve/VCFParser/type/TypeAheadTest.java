package edu.mayo.ve.VCFParser.type;

import com.mongodb.BasicDBObject;
import edu.mayo.ve.util.Tokens;
import org.junit.Test;

import java.util.HashMap;
import java.util.Set;
import static org.junit.Assert.*;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/12/13
 * Time: 8:42 AM
 * To change this template use File | Settings | File Templates.
 */
public class TypeAheadTest {
    @Test
    public void testAddCache() throws Exception {
        TypeAhead thead = new TypeAhead(1000,false);
        thead.addCache("{\"key\":\"value\"}");
        HashMap<String,Set<String>> c = thead.getCache();
        assertTrue(c.size() == 1);
        assertTrue(((Set) c.get("key")).contains("value"));
        thead.addCache("{\"key\":\"value2\"}");
        c = thead.getCache();
        assertTrue(((Set) c.get("key")).contains("value"));
        assertTrue(((Set) c.get("key")).contains("value2"));
        thead.addCache("{\"key2\":\"1\"}");
        c = thead.getCache();
        assertTrue(((Set) c.get("key2")).contains("1"));  //we don't care about this cache handling integers because we will remove then anyway!
    }

    @Test
    public void testClearCache() throws Exception {
        TypeAhead thead = new TypeAhead(1000,false);
        thead.addCache("{\"key\":\"value\"}");
        HashMap<String,Set<String>> c = thead.getCache();
        assertTrue(c.size() == 1);
        thead.clearCache();
        c =  thead.getCache();
        assertTrue(c.size()==0);
    }

    @Test
    public void testConvertCacheToDBObj() throws Exception {
        TypeAhead thead = new TypeAhead(1000,false);
        thead.addCache("{\"foo\":\"value\"}"); //don't use "key" as a key because it represents workspace!
        thead.addCache("{\"foo\":\"value2\"}");
        thead.addCache("{\"number\":\"1\"}");
        thead.addCache("{\"number\":\"2\"}");
        thead.addCache("{\"number\":\"0\"}");
        thead.addCache("{\"dnum\":\"1.2\"}");
        thead.addCache("{\"dnum\":\"1.3\"}");
        thead.addCache("{\"zero\":\"0\"}");
        BasicDBObject dbo = thead.convertCacheToDBObj("1234");
        assertTrue(dbo.size() == 2);
        assertEquals("[ \"value\" , \"value2\"]",dbo.get("foo").toString());
        assertEquals("1234",dbo.get("key").toString());
    }

    @Test
    public void testOverRun(){
        //test to make sure if there is a cache limit that is too small, that the over-run flags are set
        TypeAhead thead = new TypeAhead(2,false);
        thead.addCache("{\"foo\":\"value\"}");
        thead.addCache("{\"foo\":\"value2\"}");
        thead.addCache("{\"foo\":\"value3\"}");
        BasicDBObject dbo = thead.convertCacheToDBObj("1234");
        //check the values in the cache are correct (truncated at 2)
        assertEquals("[ \"value\" , \"value2\"]",dbo.get("foo").toString());
        assertTrue(dbo.size() == 3); //there is now one entry to account for any possible over-runs
        //check to make sure foo is marked as over-run
        assertEquals("{ \"foo\" : true}",dbo.get(Tokens.TYPE_AHEAD_OVERUN).toString());
        //System.out.println(dbo.toString());
    }

}
