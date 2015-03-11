package edu.mayo.ve.resources;

import com.mongodb.*;
import com.sun.jersey.multipart.FormDataParam;

import edu.mayo.security.CWEUtils;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.VCFLoaderPool;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.Range;
import edu.mayo.ve.resources.interfaces.DatabaseImplMongo;
import edu.mayo.ve.resources.interfaces.DatabaseInterface;
import edu.mayo.ve.util.SystemProperties;

import org.apache.commons.io.IOUtils;
import org.eclipse.jetty.servlets.MultiPartFilter;

import javax.ws.rs.*;
import javax.ws.rs.core.*;

import java.io.*;
import java.text.ParseException;
import java.util.*;

/**
 * Created by m102417 on 2/6/15.
 *
 * A Range set is a set of genomic intervals in bed/tabix query format:
 *
 The can be uploaded via a file OR as a REST POST to the server.
 *
 */
@Path("/ve/rangeSet")
public class RangeQueryInterface {

	private DatabaseInterface mDbInterface = null;
	
	/** This constructor will be called when the REST service is called */ 
    public RangeQueryInterface(){
    	mDbInterface = new DatabaseImplMongo();
    }
    
    /** This constructor can be used by test cases to pass in an implementation of the DatabaseInterface */
    public RangeQueryInterface(DatabaseInterface dbInterface) {
    	mDbInterface = dbInterface;
    }
    
    
    /**
     * upload a bed file or range file and update the VCF workspace in MongoDB
     * @param workspace - the workspace we need to modify
     * @param uploadedInputStream - streaming file containing intervals (could be in bed format)
     * @return
     * @throws Exception
     */
    @POST
    @Path("/workspace/{workspace}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadFile(
            @PathParam("workspace") String workspace,
            @FormDataParam("name") String intervalsName,
            @FormDataParam("intervalDescription") String intervalDescription,
            @FormDataParam("rangeSetText") String rangeSets,
            @FormDataParam("file") InputStream uploadedInputStream
    ) throws Exception {
    	File tempFile = null;
    	try {
	        //validate the interval name (e.g. can't have period or other funky characters, can't already be used)
	        validateName(workspace, intervalsName);
	
	        //parse the intervals into 'rangeSets' to ensure that they are well formed
	        List<String> rangeLines = checkStrings(rangeSets);
	
	        // Save the file stream to a file
	    	tempFile = CWEUtils.createSecureTempFile();
	        saveStreamToFile(tempFile, uploadedInputStream);
	        // Read the number of non-empty lines in the file
	        int numRangesInFile = countNonEmptyLines(tempFile);
	        
	        // If there are no ranges defined in either the text area OR the file, then throw an exception
	        if( (rangeLines.size() + numRangesInFile) == 0 )
	        	throw new Exception("ERROR: Please specify at least one range in either the file or the text area.");
	
	        //parse the file to ensure that all of the intervals are well formed
	        parseRangeFile(tempFile);
	        
	        int updateFrequency = getUpdateFrequency();
	
	        //update the workspace to include the new range set as a flag (intervals from text area)
	        mDbInterface.bulkUpdate(workspace, rangeLines.iterator(), updateFrequency, intervalsName);
	
	        //update the workspace to include the new range set as a flag (file intervals)
	        BufferedReader br = new BufferedReader(new FileReader(tempFile));
	        mDbInterface.bulkUpdate(workspace, new FileIterator(br), updateFrequency, intervalsName);
	
	        //update the metadata
	        updateMetadata(workspace, intervalsName, intervalDescription);
    	} finally {
    		//delete the temp file if it is not null and it exists
    		if( tempFile != null  &&  tempFile.exists() )
    			tempFile.delete();
    	}

        String response = "Workspace: " + workspace + " " + "name: " + intervalsName + " intervalDescription: " + intervalDescription + "\n rangeSetText: " + rangeSets + "\n";
        return Response.status(200).entity(response).build();
        //return uploadIntervalsFromFile(workspace, alias, uploadedInputStream);
    }
    
    /** Save the input stream to a file */
    private void saveStreamToFile(File fileToSaveTo, InputStream uploadedInputStream) throws IOException {
        //copy the contents of the input stream to a temp file, this will allow us to validate that all of the intervals in the file are correctly formed.
        OutputStream outStream = new FileOutputStream(fileToSaveTo);
        try {
            // copy data to file system
            IOUtils.copyLarge(uploadedInputStream, outStream);
        } finally {
            outStream.close();
        }
        
        // If the user did not specify a file, then it will have "null" in the file, so blank out the file and leave it empty
        if( isFileContentsNull(fileToSaveTo) ) {
        	fileToSaveTo.delete();
        	fileToSaveTo.createNewFile();
        }
	}
    
    /** Lines should have text on them - a file with one empty line counts as 0 
     * @throws IOException */
    int countNonEmptyLines(File file) throws IOException {
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
    
    // Check if a file contains only the characters "null".  This will happen if the user did not specify a file
    private boolean isFileContentsNull(File file) throws IOException {
    	FileInputStream fin = null;
    	try {
    		fin = new FileInputStream(file);
    		byte[] buff = new byte[100];
    		int len = fin.read(buff);
    		// Special case: file could be specified but empty, in which case the length will return -1 which is valid (not null)
    		// Need to check the length before converting to a string, or it will throw a StringIndexOutOfBoundsException
    		return  (len >= 0)  &&  "null".equals(new String(buff, 0, len));
    	} finally {
    		fin.close();
    	}
    }


	private int getUpdateFrequency() throws IOException {
        //get the update frequency...
        SystemProperties sysprop = new SystemProperties();
        String ibsr = sysprop.get("INTERVAL_BULK_INSERT_RATE");
        int freq = 1; //default 1 if not defined
        if(ibsr != null && ibsr.length()<1){
            freq = Integer.parseInt(ibsr);
        }
        return freq;
    }

    /**
     *
     * @param workspace    - the workspace that will get the metadata update
     * @param IntervalsName - the new name of the field
     * @param description  - the description of the new field
     */
    public void updateMetadata(String workspaceKey, String intervalsName, String description) throws Exception {
    	if( mDbInterface.isInfoFieldExists(workspaceKey, intervalsName) ) {
            throw new Exception("Invalid Field Name!, it already exists.  FIELD: " + intervalsName + " KEY: " + workspaceKey);
        }
    	mDbInterface.addInfoField(workspaceKey, intervalsName, 0, "Flag", description);
    }

    /**
     * given a string s, that has unparsed intervals one per line (\n delimited) return a list of strings representing intervals that pass validation
     * @return
     */
    public List<String> checkStrings(String intervals) throws ParseException {
        List<String> rangeLines = new ArrayList<String>();
        String[] lines = intervals.split("\n");
        for(String line : lines){
            if(line.length()>5) { //we need at least 5 characters to be a valid range e.g. 1:0-1
                //attempt to parse it into a range
                new Range(line);
                //add the range to the valid ranges checked
                rangeLines.add(line); //bulk update requires lines not ranges
            }
        }
        return rangeLines;
    }

    /**
     * validates that the name proposed by the user for an interval set is ok.
     * @param
     */
    public void validateName(String workspaceKey, String intervalsName) throws Exception {
        // First, verify that the name only contains letters, numbers, or underscores
        if( ! intervalsName.matches("[a-z,A-Z,0-9,_]+") ){
            throw new Exception("Proposed Field Name must contain only letter, numbers, or underscores.  Name: " + intervalsName);
        }
        
        // Then, verify the metadata does not already contain a field with the same name, if it does -> invalid
        if( mDbInterface.isInfoFieldExists(workspaceKey, intervalsName) )  {
            throw new Exception("Proposed Field Name is Already in use: " + intervalsName);
        }
        
        //if no exceptions were thrown then it is good to go!
    }

    // TODO: Is this even used anymore??????
    public Response uploadIntervalsFromFile(String workspace, String alias, InputStream uploadedInputStream) throws IOException {
        //save the file to the tmp space
    	File tempFile = CWEUtils.createSecureTempFile();
        OutputStream outStream = null;
        try {
            outStream = new FileOutputStream(tempFile);
            // copy data to file system
            IOUtils.copyLarge(uploadedInputStream, outStream);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            outStream.close();
        }
        //check the file for any errors
        try {
            parseRangeFile(tempFile);
        } catch (Exception e){
            //422 Unprocessable Entity (WebDAV; RFC 4918)
            //The request was well-formed but was unable to be followed due to semantic errors.
            String err = "The input ranges are not properly formed " + e.getMessage();
            return Response.status(422).entity(err).build();
        } finally {
        	tempFile.delete();
        }
        //modify the workspace based on the intervals in the file
        //todo!
        String output = "File uploaded and workspace modified : ";
        return Response.status(200).entity(output).build();
    }

    /**
     * code just generates a random number so file_names do not collide
     */
    private static Random rand = new Random();
    public static int randInt(int min, int max) {
        int randomNum = rand.nextInt((max - min) + 1) + min;
        return randomNum;
    }


    //todo:make a method that uploads the range file
    //todo:make a method that updates the VCF workspace with the range set annotation.

    /**
     * parses a rangefile into memory -- not for use on production
     * @param filename
     * @return
     * @throws IOException
     * @throws ParseException
     */
    public List<Range> parseRangeFile2Memory(String filename) throws IOException, ParseException {
        ArrayList<Range> ranges = new ArrayList<Range>();
        BufferedReader br = new BufferedReader(new FileReader(filename));
        String line = "";
        while((line = br.readLine()) != null){
            Range r = new Range(line);
            ranges.add(r);
        }
        br.close();
        return ranges;
    }

    /**
     * Validate the range file by parsing it, looking for errors as it goes through it.
     * @param filename
     * @return
     * @throws IOException
     * @throws ParseException
     */
    public void parseRangeFile(File fileWithRanges) throws IOException, ParseException {
        BufferedReader br = null;
        try {
        	br = new BufferedReader(new FileReader(fileWithRanges));
	        String line = null;
	        int lineNum = 0;
	        while( (line = br.readLine()) != null ){
	        	lineNum++;
	        	if( line.trim().length() == 0 )
	        		continue;
	            try {
	                Range range = new Range(line);
	            }catch (ParseException pe){
	                throw new ParseException("filename: " + fileWithRanges + ",  Line_Number: " + lineNum + ", Line_Content: " + line + "\n" + pe.getMessage(), 0);
	            }
	        }
        } finally {
        	if( br != null )
        	br.close();
        }
    }



    class FileIterator implements Iterator<String>
    {
        BufferedReader reader;
        FileIterator(BufferedReader myReader) { reader = myReader; };
        @Override
        public boolean hasNext() { try { return reader.ready(); }catch(Exception e){ throw new RuntimeException(e); } };
        @Override
        public String next() { try { return reader.readLine(); }catch(Exception e){ throw new RuntimeException(e); } };
        @Override
        public void remove() { throw new RuntimeException("Remove not supported!"); };
    }

}
