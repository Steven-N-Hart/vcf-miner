package edu.mayo.ve.util;

import edu.mayo.pipes.iterators.Compressor;
import edu.mayo.security.CWEUtils;

import java.io.File;
import java.io.IOException;
import java.io.LineNumberReader;

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
        File fakeOutFile = CWEUtils.createSecureTempFile();
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
}
