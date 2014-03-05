package edu.mayo.Factories;

import edu.mayo.pipes.iterators.Compressor;

import java.io.*;
import java.util.zip.GZIPInputStream;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 12/11/13
 * Time: 4:00 PM
 * This class is a factory that will build the following basic stack for an (compressed) input stream:
    InputStream fileStream = new FileInputStream(filename);
    InputStream gzipStream = new GZIPInputStream(fileStream);
    Reader decoder = new InputStreamReader(gzipStream, encoding);
    BufferedReader buffered = new BufferedReader(decoder);
 */
public class InputStreamBufferedReaderFactory {

    /**
     * This method expects that the user of the API has normalized the zip suffix to .zip, .gz, .bz or the empty string for uncompressed before they use this method.
     * @param stream - the input stream
     * @param zipSuffix e.g. .zip, .gz ect.
     * @param reporting - if the status of the if checks should be printed out
     * @return
     */
    public static BufferedReader constructBufferedReader(InputStream stream, String zipSuffix, boolean reporting) throws UnsupportedEncodingException, IOException {
        Compressor compressor = new Compressor(null,null);
        if(zipSuffix.contains(".gz")){
            if(reporting) System.out.println("InputStreamBufferedReaderFactory is creating a .gz BufferedReader");
            GZIPInputStream gzin = new GZIPInputStream(stream);
            Reader decoder = new InputStreamReader(gzin, "UTF-8");
            BufferedReader br = new BufferedReader(decoder);
            return br;
        }
        if(zipSuffix.contains(".zip")){
            if(reporting) System.out.println("InputStreamBufferedReaderFactory is creating a .zip BufferedReader");
            return compressor.makeZipReader(stream);
        }
        if(zipSuffix.contains(".bz")){
            if(reporting) System.out.println("InputStreamBufferedReaderFactory is creating a .bz BufferedReader");
            return compressor.makeBZipReader(stream);
        }
        //under all other cases, assume it is not compressed
        if(reporting) System.out.println("InputStreamBufferedReaderFactory is creating a BufferedReader with no compression");
        return noCompressionBufferedReader(stream);
    }

    private static BufferedReader noCompressionBufferedReader(InputStream stream) throws UnsupportedEncodingException {
        return new BufferedReader(new InputStreamReader(stream, "UTF-8"));
    }


}
