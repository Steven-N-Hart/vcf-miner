package edu.mayo.ve.FunctionalTests;

import com.mongodb.DBObject;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.VCFErrorFileUtils;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.ve.resources.Provision;
import org.eclipse.jetty.util.ajax.JSON;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;

import static org.junit.Assert.assertEquals;

/**
 * Created by m102417 on 7/3/14.
 */
public class MetaDataITCase {

    private static String workspace;
    private static String errorFile;
    private static String vcf;

    @BeforeClass
    public static void setup() throws IOException {
        //provision the workspace
        Provision prov = new Provision();
        String json = prov.provision("test", "alias");

        //get out the id for the newly minted workspace...
        System.out.println(json);
        HashMap response = (HashMap) JSON.parse(json);
        workspace = (String) response.get(Tokens.KEY);
        System.out.println("Workspace Provisioned with key: " + workspace);
        writeErrorFile(workspace);
        writeFooVCF(workspace);
    }

    @AfterClass
    public static void cleanup(){
        File e = new File(errorFile);
        e.delete();
        File v = new File(vcf);
        v.delete();
    }

    public static void writeErrorFile(String workspace) throws IOException {
        errorFile = VCFErrorFileUtils.getLoadErrorFilePath(workspace);
        BufferedWriter out = new BufferedWriter(new FileWriter(errorFile));
        out.write("WARNING: Warning 1\n");
        out.write("ERROR: ERROR 1\n");
        out.write("WARNING: Warning 2\n");
        out.close();
    }

    public static void writeFooVCF(String workspace) throws IOException {
        vcf = VCFErrorFileUtils.getLoadErrorFilePath(workspace).replaceAll("\\.errors$","");
        BufferedWriter out = new BufferedWriter(new FileWriter(vcf));
        out.write("this is not a real vcf\n");
        out.write("but if it were a real vcf\n");
        out.write("You might as well sing the alphabet too... \n");
        out.close();
    }


    @Test
    public void testConstructStatsObject() throws IOException {
        MetaData meta = new MetaData();
        HashMap<String,Long> example = new HashMap<String, Long>();
        example.put("foo", (long) 1);
        example.put("bar", (long) 3);
        DBObject result = meta.constructStatsObject(workspace,example);
        assertEquals((long) 1, result.get("foo"));
        assertEquals((long) 3, result.get("bar"));
        assertEquals((long) 2, result.get("WARNINGS"));
        assertEquals((long) 1, result.get("ERRORS"));
        assertEquals((long) 93, result.get("VCF_FILE_SIZE"));

    }

    @Test
    public void testModifyMetadata() throws IOException {
        //check that the metadata in the workspace is correct right after provisioning
        MetaData meta = new MetaData();
        String bjson = meta.getWorkspaceJSON(workspace);
        HashMap before = (HashMap) JSON.parse(bjson);
        assertEquals(5, before.size());
        assertEquals(workspace, before.get(Tokens.KEY));
        assertEquals("alias", before.get("alias"));
        assertEquals("test", before.get("owner"));
        assertEquals((long) 1, before.get("ready"));

        //call updateLoadStatistics...
        HashMap<String,Integer> context = new HashMap<String, Integer>();
        int totalTime = 36000;
        int lines = 100;
        int comments = 20;

        context.put(Tokens.TimeElapsed, totalTime);
        context.put(Tokens.TOTAL_LINE_COUNT, lines);
        context.put(Tokens.HEADER_LINE_COUNT, comments);
        context.put(Tokens.DATA_LINE_COUNT, lines-comments);
        meta.updateLoadStatistics(workspace, context);

        //check that we correctly updated the statistics with a call to updateLoadStatistics
        String ajson = meta.getWorkspaceJSON(workspace);
        HashMap after = (HashMap) JSON.parse(ajson);
        assertEquals(6, after.size());
        //make sure all the stuff we started with is still there
        assertEquals(workspace, before.get(Tokens.KEY));
        assertEquals("alias", before.get("alias"));
        assertEquals("test", before.get("owner"));
        assertEquals((long) 1, before.get("ready"));

        //check to see that the ID is the same ID that it was before...
        HashMap bids = (HashMap) before.get("_id");
        String bid = (String) bids.get("$oid");
        HashMap aids = (HashMap) after.get("_id");
        String aid = (String) aids.get("$oid");
        assertEquals(bid, aid);

        //now check STATISTICS sub-field
        HashMap statistics = (HashMap) after.get("STATISTICS");
        assertEquals((long) 20, statistics.get("header_line_count"));
        assertEquals((long) 93, statistics.get("VCF_FILE_SIZE"));
        assertEquals((long) totalTime, statistics.get(Tokens.TimeElapsed));
        assertEquals((long) 2, statistics.get("WARNINGS"));
        assertEquals((long) 100, statistics.get("total_line_count"));
        assertEquals((long) 1, statistics.get("ERRORS"));

    }

    @Test
    public void testChangeState(){
        MetaData meta = new MetaData();
        meta.flagAsNotReady(workspace);
        HashMap md = (HashMap) JSON.parse(meta.getWorkspaceJSON(workspace));
        assertEquals("test", md.get("owner"));
        assertEquals((long) 0, md.get("ready"));
        assertEquals("workspace is not ready", md.get("status"));

        //queued
        meta.flagAsQueued(workspace);
        md = (HashMap) JSON.parse(meta.getWorkspaceJSON(workspace));
        assertEquals("test", md.get("owner"));
        assertEquals((long) 2, md.get("ready"));
        assertEquals("workspace is queued for loading", md.get("status"));

        //failed
        meta.flagAsFailed(workspace, "example fail");
        md = (HashMap) JSON.parse(meta.getWorkspaceJSON(workspace));
        assertEquals("test", md.get("owner"));
        assertEquals((long) -1, md.get("ready"));
        assertEquals("example fail", md.get("status"));

        //back to ready
        meta.flagAsReady(workspace);
        md = (HashMap) JSON.parse(meta.getWorkspaceJSON(workspace));
        assertEquals("test", md.get("owner"));
        assertEquals((long) 1, md.get("ready"));
        assertEquals("workspace is ready", md.get("status"));

    }


}
