package edu.mayo.ve.FunctionalTests;

//import com.javafx.tools.doclets.formats.html.SourceToHTMLConverter;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.resources.Provision;
import edu.mayo.ve.resources.Workspace;
import org.junit.AfterClass;
import org.junit.Test;

import java.io.IOException;

import static com.mongodb.util.MyAsserts.assertTrue;

/**
 * Created by m102417 on 6/4/14.
 */
public class VCFImportPerformanceITCase {

    private static String vcf = "src/test/resources/testData/CustomCapture.anno5000.vcf";
    private static String workspace = "wde424d18ecd27a209baddacb97a7dd591ad355d8";

    @AfterClass
    public static void tearDown()
    {
        //delete the workspace - after the test is done
        System.out.println("Deleting Workspace: " + workspace);
        Workspace w = new Workspace();
        w.deleteWorkspace(workspace);
    }

    @Test
    public void loadPerformanceTest() throws IOException, ProcessTerminatedException {
        //provision the workspace (not a performance concern typically)
        System.out.println("Make sure to have MongoDB up and running on localhost (or wherever specified in your sys.properties file) before you try to run this functional test!");
        System.out.println("ProblemVCFITCase.Provision a new workspace...");
        Provision prov = new Provision();
        String alias = "alias";
        String user = "steve";
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        workspace = (String) w.get(Tokens.KEY);
        System.out.println("Workspace provisioned with key: " + workspace);

        System.out.println("ProblemVCF.Loading data into a new workspace...");
        long starttime = System.currentTimeMillis();
        VCFParser parser = new VCFParser();
        parser.parse(vcf, workspace);  //put true in the second to last param for verbose load reporting
        long endtime = System.currentTimeMillis();
        System.out.println("total time elapsed on import: " + (endtime - starttime));
        assertTrue(endtime - starttime < 90000);   //observed 88645
        //check that the average line performance is within some delta of the initial line performance
        //i.e. it does not slow down over time.
        Double elapsedDeltaMesured = Math.abs(parser.getAverageLinePerformance() - parser.getInitialLinePerformance());
        Double delta = 100.0; //observed 81.81822899505767 with the initial being a lot slower!
        System.out.println("average elapsed time per line: " + parser.getAverageLinePerformance());
        System.out.println("initial elapsed time per line: " + parser.getInitialLinePerformance());
        System.out.println("delta observed: " + elapsedDeltaMesured);
        assertTrue(elapsedDeltaMesured < delta);
    }



}
