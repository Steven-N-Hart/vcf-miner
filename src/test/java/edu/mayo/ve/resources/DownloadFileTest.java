package edu.mayo.ve.resources;

import edu.mayo.ve.message.QuerryDownload;
import org.junit.Test;

import java.util.List;

import static org.junit.Assert.assertEquals;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 10/16/13
 * Time: 8:09 PM
 * To change this template use File | Settings | File Templates.
 */
public class DownloadFileTest {

    @Test
    public void testUnmarshall() throws Exception {
        String json = "{\"workspace\" : \"w1045d932d17fcbd34577f4a038d158686319f20d\", \"returnFields\":[\"CHROM\",\"INFO\"]}";
        DownloadFile df = new DownloadFile();
        QuerryDownload qd = df.unmarshall(json);
        assertEquals(qd.getWorkspace(), "w1045d932d17fcbd34577f4a038d158686319f20d");

        List<String> fields =  qd.getReturnFields();
        assertEquals(fields.get(0), "CHROM");
        assertEquals(fields.get(1), "INFO");

    }
}
