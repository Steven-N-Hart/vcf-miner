package edu.mayo.ve.VCFParser;

import com.mongodb.DBCollection;
import edu.mayo.util.SystemProperties;
import edu.mayo.ve.util.MongoConnection;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by m102417 on 6/30/14.
 */
public class VCFErrorFileUtils {

    /**
     * @param workspaceID
     * @param numlines - number of lines from the file we wish to return (from the start of the file)
     * @return
     */
    public static List<String> getNErrors(String workspaceID, int numlines) throws IOException {
        ArrayList<String> result = new ArrayList<String>();
        String path = getLoadErrorFilePath(workspaceID);
        BufferedReader br = new BufferedReader(new FileReader(path));
        try {
            int count = 0;
            String line;
            while((line = br.readLine()) != null){
                result.add(line);
                count++;
                if(count >= numlines) break;
            }
            return result;
        } finally {
            br.close();
        }
    }

    /**
     * calculates the number of ERRORS, WARNINGS ECT. in the VCF file.
     * @param workspaceID
     * @return
     */
    public static ErrorStats calculateErrorStatistics(String workspaceID) throws IOException {
        int error = 0;
        int warning = 0;
        String path = getLoadErrorFilePath(workspaceID);
        BufferedReader br = new BufferedReader(new FileReader(path));
        try {
            String line;
            while((line = br.readLine()) != null){
                if(line.startsWith("WARNING")){
                    warning++;
                }else if(line.startsWith("ERROR")){
                    error++;
                }
            }
            return new ErrorStats(error,warning);
        } finally {
            br.close();
        }
    }

    /**
     * deletes the error file for a given load
     * @param workspaceID
     * @throws IOException
     */
    public static void deleteLoadErrorFile(String workspaceID) throws IOException {
        String path = getLoadErrorFilePath(workspaceID);
        File f = new File(path);
        if(f.exists()){
            f.delete();
        }
    }

    public static String getLoadErrorFilePath(String workspaceID) throws IOException {

        DBCollection workspaceCol = edu.mayo.util.MongoConnection.getDB().getCollection(workspaceID);

        SystemProperties sysprop = new SystemProperties();
        String tmp = sysprop.get("TEMPDIR");
        String path = tmp + File.separator + workspaceCol.getName() + ".errors";
        return path;
    }
}
