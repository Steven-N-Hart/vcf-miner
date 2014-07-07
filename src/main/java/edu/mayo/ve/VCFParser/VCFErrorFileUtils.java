package edu.mayo.ve.VCFParser;

import edu.mayo.util.SystemProperties;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by m102417 on 6/30/14.
 */
public class VCFErrorFileUtils {

    /**
     * @param errorFilePath
     * @param numlines - number of lines from the file we wish to return (from the start of the file)
     * @return
     */
    public static List<String> getNErrors(String errorFilePath, int numlines) throws IOException {
        ArrayList<String> result = new ArrayList<String>();
        BufferedReader br = new BufferedReader(new FileReader(errorFilePath));
        int count = 0;
        String line;
        while((line = br.readLine()) != null){
            result.add(line);
            count++;
            if(count >= numlines) break;
        }
        return result;
    }

    /**
     * calculates the number of ERRORS, WARNINGS ECT. in the VCF file.
     * @param errorFilePath - the error log file
     * @return
     */
    public static ErrorStats calculateErrorStatistics(String errorFilePath) throws IOException {
        int error = 0;
        int warning = 0;
        BufferedReader br = new BufferedReader(new FileReader(errorFilePath));
        String line;
        while((line = br.readLine()) != null){
            if(line.startsWith("WARNING")){
                warning++;
            }else if(line.startsWith("ERROR")){
                error++;
            }
        }
        return new ErrorStats(error,warning);
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
        SystemProperties sysprop = new SystemProperties();
        String tmp = sysprop.get("TEMPDIR");
        String path = tmp + File.separator + workspaceID + ".errors";
        return path;
    }
}
