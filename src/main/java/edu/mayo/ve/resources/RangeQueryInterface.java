package edu.mayo.ve.resources;

import com.mongodb.*;
import com.sun.jersey.multipart.FormDataParam;

import edu.mayo.security.CWEUtils;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.LoaderPool;
import edu.mayo.ve.message.Range;
import edu.mayo.ve.message.RangeUploadResponse;
import edu.mayo.ve.resources.interfaces.DatabaseImplMongo;
import edu.mayo.ve.resources.interfaces.DatabaseInterface;
import edu.mayo.ve.range.FileIterator;
import edu.mayo.ve.range.RangeWorker;
import edu.mayo.ve.util.SystemProperties;
import edu.mayo.ve.util.Tokens;
import org.apache.commons.io.IOUtils;
import org.eclipse.jetty.servlets.MultiPartFilter;

import javax.ws.rs.*;
import javax.ws.rs.core.*;
import java.io.*;
import java.text.ParseException;
import java.util.*;
import java.util.logging.Logger;

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
    
    private boolean verboseMode = false;
    private static final Logger log = Logger.getLogger(RangeQueryInterface.class.getCanonicalName());

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
     * for more detailed logging, use verbose = true in the constructor
     * @param verbose
     */
    public RangeQueryInterface(boolean verbose){
        verboseMode = verbose;
        setVerboseMode();
    }

    public void setVerboseMode(){
        LoaderPool.setReportingTrueAndResetRangePool();
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
    @Produces("application/json")
    public RangeUploadResponse uploadFile(
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
            List<String> rangeLines = validateRangeLines(rangeSets);


            //copy the contents of the input stream to a temp file, this will allow us to validate that all of the intervals in the file are correctly formed.
            if (verboseMode) {
                log.info("Copying the interval file to the local filesystem");
            }
            // Save the file stream to a file
            tempFile = CWEUtils.createSecureTempFile();
            saveStreamToFile(tempFile, uploadedInputStream);
            // Read the number of non-empty lines in the file
            int numRangesInFile = countNonEmptyLines(tempFile);

            // If there are no ranges defined in either the text area OR the file, then throw an exception
            if ((rangeLines.size() + numRangesInFile) == 0)
                throw new Exception("ERROR: Please specify at least one range in either the file or the text area.");

            //parse the file to ensure that all of the intervals are well formed
            //add a try catch to inform the user that the validation failed on the file upload
            parseRangeFile(tempFile);

            //get the update frequency...
            int updateFrequency = getUpdateFrequency();

            //update the workspace to include the new range set as a flag (intervals from form)
            mDbInterface.bulkUpdate(workspace, rangeLines.iterator(), updateFrequency, intervalsName);


            //update the workspace to include the new range set as a flag (file intervals)
            BufferedReader br = new BufferedReader(new FileReader(tempFile));
            mDbInterface.bulkUpdate(workspace, new FileIterator(br), updateFrequency, intervalsName);


            //update the metadata  --perhaps we need to not do this if the operation failed?  todo:!
            updateMetadata(workspace, intervalsName, intervalDescription);

            //flag the workspace as queued
            MetaData meta = new MetaData();
            meta.flagAsQueued(workspace);

            //update the workspace to include the new range set as a flag (file intervals)
            //doing update inline...
            //File intervalFile = new File(uploadedFileLocation);
            //BufferedReader br = new BufferedReader(new FileReader(intervalFile));
            //bulkUpdate(workspace, new FileIterator(br), n, name);
            addTaskToWorkerPool(workspace, tempFile.getCanonicalPath(), intervalsName);

        }finally {
            //delete the temp file if it is not null and it exists
            if( tempFile != null  &&  tempFile.exists() )
                tempFile.delete();
        }

        // TODO: Currently hardcoded to look for the word "background" in the name
        // TODO: if found, treated as background.  Otherwise, treated as interactive
        RangeUploadResponse response = new RangeUploadResponse();
        boolean isBackground = false;
        if (intervalsName.contains("background")) {
            isBackground = true;
        }
        response.setIsBackground(isBackground);
        return response;

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

    protected int getUpdateFrequency() throws IOException {
        //get the update frequency...
        SystemProperties sysprop = new SystemProperties();
        String ibsr = sysprop.get("INTERVAL_BULK_INSERT_RATE");
        int freq = 1; //default 1 if not defined
        if(ibsr != null && ibsr.length()<1){
            freq = Integer.parseInt(ibsr);
        }
        return freq;
    }

    /** Lines should have text on them - a file with one empty line counts as 0 
     * @throws IOException */
    public int countNonEmptyLines(File file) throws IOException {
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
    


    /**
     * adds the task of inserting the interval as a new field to the range worker pool as a background process.  gets updateFreq
     * from the configuration file
     * @param workspace  - the key for the workspace we are modifying
     * @param inputFile  - bed/ tabix interval file that we get the intervals from
     * @param field      - the name of the new INFO field
     */
    public Task addTaskToWorkerPool(String workspace, String inputFile, String field) {
        int freq = 1;
        return addTaskToWorkerPool(workspace,inputFile,field,freq);
    }

    /**
     * adds the task of inserting the interval as a new field to the range worker pool as a background process.
     * @param workspace  - the key for the workspace we are modifying
     * @param inputFile  - bed/ tabix interval file that we get the intervals from
     * @param field      - the name of the new INFO field
     * @param updateFreq - for bulk insert, the number of records we should parse before sending the update to mongo
     */
    public Task addTaskToWorkerPool(String workspace, String inputFile, String field, int updateFreq) {
        WorkerPool pool = LoaderPool.getRangeWorkerPool();
        Task<HashMap,HashMap> t = getTask(workspace,inputFile,field,updateFreq);
        pool.addTask(t);
        pool.startTask(t.getId());
        return t;
    }

    public Task getTask(String workspace, String inputFile, String field, int updateFreq){
        Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
        HashMap<String,String> fields = new HashMap<String,String>();
        fields.put(RangeWorker.INTERVAL_NAME,field);
        fields.put(RangeWorker.RANGE_FILE, inputFile);
        fields.put(RangeWorker.UPDATE_FREQ, String.valueOf(updateFreq));
        fields.put(Tokens.KEY,workspace);
        t.setCommandContext(fields);
        return t;
    }

    /**
     *
     * @param workspaceKey    - the workspace that will get the metadata update
     * @param intervalsName - the new name of the field
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
    public List<String> validateRangeLines(String intervals) throws ParseException {
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
     * @throws Exception
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

    /**
     *
     * @param wkspID       - the workspace key
     * @param name  - a valid (INFO) name
     * @return
     * @throws IOException
     */
    public String getUploadFileLocation(String wkspID, String name) throws IOException {
        SystemProperties sysprop = new SystemProperties();
        String tmpdir = sysprop.get("TEMPDIR");
        return tmpdir + File.separator + wkspID + "." + name;
    }

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
     * @param fileWithRanges
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





}
