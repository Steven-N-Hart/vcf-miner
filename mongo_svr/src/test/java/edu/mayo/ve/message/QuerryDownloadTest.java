package edu.mayo.ve.message;

import com.mongodb.BasicDBObject;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 10/9/13
 * Time: 10:31 AM
 * To change this template use File | Settings | File Templates.
 */
public class QuerryDownloadTest {

    @Test
    public void testNest() throws Exception {
        QuerryDownload qd = new QuerryDownload();
        BasicDBObject bo = qd.nest(new BasicDBObject(), "INFO");
        assertTrue(bo.size() == 1);
        assertEquals(1, bo.get("INFO"));

        //
        bo = qd.nest(new BasicDBObject(), "INFO.CSQ");
        assertTrue(bo.size() == 1);
        assertEquals(1, ((BasicDBObject) bo.get("INFO")).get("CSQ") );
    }
}
