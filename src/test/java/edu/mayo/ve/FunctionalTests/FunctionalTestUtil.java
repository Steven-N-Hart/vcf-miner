package edu.mayo.ve.FunctionalTests;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.util.Tokens;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.resources.Provision;
import org.apache.log4j.Logger;

import java.io.File;

public class FunctionalTestUtil {

    private static final Logger LOGGER = Logger.getLogger(FunctionalTestUtil.class);

    /**
     * Load a VCF file into mongodb.
     *
     * @param vcf
     * @param user
     * @param alias
     * @param overflowThreshold
     * @param reporting
     * @return
     * @throws ProcessTerminatedException
     */
    public static String load(File vcf, String user, String alias, int overflowThreshold, boolean reporting) throws ProcessTerminatedException {

        LOGGER.info("Provision a new workspace...");
        Provision prov = new Provision();
        String json = prov.provision(user,alias);
        DBObject w = (DBObject) JSON.parse(json);
        String workspaceKey = (String) w.get(Tokens.KEY);
        LOGGER.info("Workspace " + alias + " provisioned with key: " + workspaceKey);

        LOGGER.info("Loading data into a new workspace...");
        VCFParser parser = new VCFParser();
        parser.parse(null, vcf.getAbsolutePath(), workspaceKey, overflowThreshold, reporting, false);  //put true in the second to last param for verbose load reporting
        return workspaceKey;
    }

}