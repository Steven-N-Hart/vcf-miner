package edu.mayo.ve.resources;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import edu.mayo.ve.message.QuerryDownload;
import org.junit.Test;

import java.util.Arrays;
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

    private DownloadFile df = new DownloadFile();

    @Test
    public void testUnmarshall() throws Exception {
        String json = "{\"workspace\" : \"w1045d932d17fcbd34577f4a038d158686319f20d\", \"returnFields\":[\"CHROM\",\"INFO\"]}";
        QuerryDownload qd = df.unmarshall(json);
        assertEquals(qd.getWorkspace(), "w1045d932d17fcbd34577f4a038d158686319f20d");

        List<String> fields =  qd.getReturnFields();
        assertEquals(fields.get(0), "CHROM");
        assertEquals(fields.get(1), "INFO");

    }

    @Test
    public void testFormat() {
        DBObject dbo = new BasicDBObject();
        dbo.put("CHROM", "1");
        dbo.put("POS", 860260);
        dbo.put("ID", ".");

        DBObject formatObj = new BasicDBObject();
        BasicDBList sampleArr = new BasicDBList(); sampleArr.addAll(Arrays.asList("sample1", "sample2"));
        formatObj.put("GenotypePositiveList", sampleArr);
        formatObj.put("GenotypePostitiveCount", sampleArr.size());
        dbo.put("FORMAT", formatObj);

        DBObject infoObj = new BasicDBObject();
        infoObj.put("ANNOTATION_FLAG",   true);
        infoObj.put("ANNOTATION_INT",    1);
        infoObj.put("ANNOTATION_DOUBLE", 1.1);
        infoObj.put("ANNOTATION_STR",    "FOOBAR");
        BasicDBList strArr = new BasicDBList(); strArr.addAll(Arrays.asList("A", "B", "C"));
        BasicDBList intArr = new BasicDBList(); intArr.addAll(Arrays.asList(1, 2, 3));
        BasicDBList doubleArr = new BasicDBList(); doubleArr.addAll(Arrays.asList(1.1, 2.2, 3.3));
        infoObj.put("ANNOTATION_INT_ARR",    intArr);
        infoObj.put("ANNOTATION_DOUBLE_ARR", doubleArr);
        infoObj.put("ANNOTATION_STR_ARR",    strArr);
        dbo.put("INFO", infoObj);

        assertEquals("1",                df.format("CHROM", dbo));
        assertEquals("860260",           df.format("POS", dbo));
        assertEquals(".",                df.format("ID", dbo));
        assertEquals("sample1;sample2",  df.format("FORMAT.GenotypePositiveList", dbo));
        assertEquals("2",                df.format("FORMAT.GenotypePostitiveCount", dbo));
        assertEquals("true",             df.format("INFO.ANNOTATION_FLAG", dbo));
        assertEquals("1",                df.format("INFO.ANNOTATION_INT", dbo));
        assertEquals("1.1",              df.format("INFO.ANNOTATION_DOUBLE", dbo));
        assertEquals("FOOBAR",           df.format("INFO.ANNOTATION_STR", dbo));
        assertEquals("1;2;3",            df.format("INFO.ANNOTATION_INT_ARR", dbo));
        assertEquals("1.1;2.2;3.3",      df.format("INFO.ANNOTATION_DOUBLE_ARR", dbo));
        assertEquals("A;B;C",            df.format("INFO.ANNOTATION_STR_ARR", dbo));

        // keys that do not exist
        assertEquals(".",      df.format("DOES_NOT_EXIST", dbo));
        assertEquals(".",      df.format("DOES.NOT.EXIST", dbo));
    }
}
