package edu.mayo.ve.util;

import edu.mayo.pipes.iterators.Compressor;
import edu.mayo.security.CWEUtils;
import edu.mayo.ve.VCFParser.VCFErrorFileUtils;

import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;

public class IOUtils {

    /**
     * Gets the total line count for the given file.
     * @param f
     *      The file to be inspected.
     * @return
     *      The line count for the given file.
     * @throws java.io.IOException
     */
    public static int getLineCount(File f) throws IOException {

        // use compressor to figure out how to handle .zip, .gz, .bz2, etc...
        File fakeOutFile = createTempFile();
        Compressor compressor = new Compressor(f, fakeOutFile);

        LineNumberReader reader = null;
        try {

            reader = new LineNumberReader(compressor.getReader());
            reader.skip(Long.MAX_VALUE);
            // First line is 0, so add one
            return reader.getLineNumber() + 1;

        } finally {
            reader.close();
            fakeOutFile.delete();
        }
    }
    
    /** Create a secure (sufficiently random filename) empty temp file in the TEMPDIR dir referred to in sys.properties */
    public static File createTempFile() throws IOException {
        String tmpdir = new SystemProperties().get("TEMPDIR");
    	return CWEUtils.createSecureTempFile(tmpdir);
    }

    /** Lines should have text on them - a file with one empty line counts as 0 
     * @throws IOException */
    public static int countNonEmptyLines(File file) throws IOException {
        BufferedReader fin = null;
        int nonEmptyLineCount = 0;
        try {
            fin = new BufferedReader(new FileReader(file));
            String line = null;
            while( (line = fin.readLine()) != null ) {
                if( line.trim().length() > 0 )
                    nonEmptyLineCount++;
            }
        } finally {
            if( fin != null )
                fin.close();
        }
        return nonEmptyLineCount;
    }

	public static void appendToFile(File tempFile, String str) throws IOException {
		BufferedOutputStream fout = null;
		try {
			fout = new BufferedOutputStream(new FileOutputStream(tempFile, true));
			fout.write(str.getBytes());
		} finally {
			if( fout != null )
				fout.close();
		}
	}

    /**
     * Writes the given mesg to the workspace errors file.
     * @param workspace
     *      The workspace key.
     * @param mesg
     *      The error message to write to the file.
     * @throws IOException
     */
    public static void writeToErrorFile(String workspace, String mesg) throws IOException {
        String errorFile = VCFErrorFileUtils.getLoadErrorFilePath(workspace);

        PrintWriter pWtr = new PrintWriter(new FileWriter(errorFile, true));

        try {
        	// Get date as "yyyy-MM-dd HH:mm:ss"
        	SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        	String dateStr = dateFormat.format(new Date());
            pWtr.println("ERROR: (" + dateStr + ")  " + mesg);
        } finally {
            pWtr.close();
        }
    }
}
