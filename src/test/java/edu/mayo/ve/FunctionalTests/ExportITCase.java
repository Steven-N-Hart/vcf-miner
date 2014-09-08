package edu.mayo.ve.FunctionalTests;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.QuerryDownload;
import edu.mayo.ve.resources.DownloadFile;
import edu.mayo.ve.resources.Provision;
import edu.mayo.ve.resources.Workspace;
import junit.framework.Assert;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.core.StreamingOutput;
import java.io.*;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Locale;

import static junit.framework.Assert.assertTrue;
import static org.junit.Assert.assertEquals;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 2/11/14
 * Time: 10:49 AM
 * To change this template use File | Settings | File Templates.
 */
public class ExportITCase {
    private static String vcf = "src/test/resources/testData/TNBC_Cases_Controls.snpeff.annotation.vcf";
    private static String exportFile = "src/test/resources/testData/export.txt";
    private static ProblemVCFITCase it;
    private static String workspace = "wee16c14d3c19a8e83388c491c395df4cac4db859";

    @BeforeClass
    public static void init() throws IOException, ProcessTerminatedException {
        it = new ProblemVCFITCase();
        String workspace = load(vcf, false);
        //delete the file that this test creates, just to make sure everything is ok for the test.
        checkAndDelete(exportFile);
    }

    @AfterClass
    public static void cleanup() throws IOException {
        checkAndDelete(exportFile);
        delete(workspace,0,0);  // wow lots of casting errors in this file!
    }

    /**
     * Not returning sample names or counts on export
     *
     * Investigated by getting the latest mongo_svr and mongo_view projects from SVN.
     * Loaded the VCF ile TNBC_Cases_Controls.snpeff.annotation.vcf and attempted to export the default columns.
     * Was able to reproduce the problem as the #_Samples and Samples columns just show a "." character, no data.
     * Things seem okay in the front-end. Here is the REST call that is performed:

     curl -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode 'json={"numberResults":"1000","workspace":"w26067d81db90c63511e69ca289d3940441678b05","sampleGroups":[],"infoFlagFilters":[],"infoNumberFilters":[],"infoStringFilters":[],"sampleNumberFilters":[],"returnFields":["CHROM","POS","ID","REF","ALT","GenotypePostitiveCount","GenotypePositiveList"],"displayFields":["CHROM","POS","ID","REF","ALT","#_Samples","Samples"],"displayFiltersApplied":[{"filterText":"none ","numberVariantsRemaining":825}]}' http://localhost:8080/mongo_svr/download
     *
     *  This unit test verifies that this bug does not happen on TNBC_Cases_Controls.snpeff.annotation.vcf
     *
     * @throws IOException
     * @throws ProcessTerminatedException
     */

    @Test
    public void testExport() throws Exception {
        System.out.println("Testing Export Functionality");
        int lineCount = 0;
        String json = "{\"numberResults\":\"1000\",\"workspace\":\""+workspace+"\",\"sampleGroups\":[],\"infoFlagFilters\":[],\"infoNumberFilters\":[],\"infoStringFilters\":[],\"sampleNumberFilters\":[],\"returnFields\":[\"CHROM\",\"POS\",\"ID\",\"REF\",\"ALT\",\"FORMAT.GenotypePostitiveCount\",\"FORMAT.GenotypePositiveList\"],\"displayFields\":[\"CHROM\",\"POS\",\"ID\",\"REF\",\"ALT\",\"#_Samples\",\"Samples\"],\"displayFiltersApplied\":[{\"filterText\":\"none \",\"numberVariantsRemaining\":825}]}";

        DownloadFile df = new DownloadFile();
        df.setResponse(doGet());
        StreamingOutput outStream = df.generateFile(json);

        OutputStream output = new FileOutputStream(exportFile);
        outStream.write(output);

        //now open the file written and check it has the correct number of lines, and that the start of the file
        //is correct
        BufferedReader br = new BufferedReader(new FileReader(exportFile));
        for(String line; (line = br.readLine()) != null;){
            //System.out.println(line);
            if(lineCount < first5RowsExported.size()){
                assertEquals(first5RowsExported.get(lineCount),line);
            }
            lineCount++;
        }

        assertEquals(829, lineCount);
        output.close();
    }

    List<String> first5RowsExported = Arrays.asList("##Filter\t#Variants",
                  "##none \t825",
                  "#CHROM\tPOS\tID\tREF\tALT\t#_Samples\tSamples",
                  "chr1\t13656\t.\tCAG\tC\t2\ts_Mayo_TN_CC_175;s_Mayo_TN_CC_365",
                  "chr1\t14930\t.\tA\tG\t1\ts_Mayo_TN_CC_664");

    private static void checkAndDelete(String filename){
        File f = new File(filename);
        if(f.exists()){
            f.delete();
        }
    }

    private static String load(String inputVCF, boolean reporting) throws IOException, ProcessTerminatedException {
        workspace = it.load(vcf,reporting);
        System.out.println("workspace: " + workspace);
        return workspace;
    }

    private static void delete(String workspaceID, int errors, int warnings) throws IOException {
        ProblemVCFITCase.deleteCheck(workspaceID, errors, warnings);
    }

    private String getAlias(String path){
        String[] tokens = path.split("/");
        return tokens[tokens.length-1];
    }

    /**
     * how you create a 'whatever' servelet, so Jersey does not think it is null
     * @return
     */
    private HttpServletResponse doGet(){
        return new HttpServletResponse(){

            @Override
            public void addCookie(Cookie cookie) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public boolean containsHeader(String s) {
                return false;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String encodeURL(String s) {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String encodeRedirectURL(String s) {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String encodeUrl(String s) {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String encodeRedirectUrl(String s) {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void sendError(int i, String s) throws IOException {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void sendError(int i) throws IOException {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void sendRedirect(String s) throws IOException {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setDateHeader(String s, long l) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void addDateHeader(String s, long l) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setHeader(String s, String s2) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void addHeader(String s, String s2) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setIntHeader(String s, int i) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void addIntHeader(String s, int i) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setStatus(int i) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setStatus(int i, String s) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public int getStatus() {
                return 0;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String getHeader(String s) {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public Collection<String> getHeaders(String s) {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public Collection<String> getHeaderNames() {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String getCharacterEncoding() {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public String getContentType() {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public ServletOutputStream getOutputStream() throws IOException {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public PrintWriter getWriter() throws IOException {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setCharacterEncoding(String s) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setContentLength(int i) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setContentType(String s) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setBufferSize(int i) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public int getBufferSize() {
                return 0;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void flushBuffer() throws IOException {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void resetBuffer() {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public boolean isCommitted() {
                return false;  //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void reset() {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public void setLocale(Locale locale) {
                //To change body of implemented methods use File | Settings | File Templates.
            }

            @Override
            public Locale getLocale() {
                return null;  //To change body of implemented methods use File | Settings | File Templates.
            }
        };
    }

}
