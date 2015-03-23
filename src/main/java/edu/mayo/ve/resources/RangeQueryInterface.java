package edu.mayo.ve.resources;

import com.sun.jersey.multipart.FormDataParam;

import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.ve.LoaderPool;
import edu.mayo.ve.dbinterfaces.DatabaseImplMongo;
import edu.mayo.ve.dbinterfaces.DatabaseInterface;
import edu.mayo.ve.message.Range;
import edu.mayo.ve.message.RangeUploadResponse;
import edu.mayo.ve.range.RangeWorker;
import edu.mayo.ve.util.SystemProperties;
import edu.mayo.ve.util.Tokens;

import org.apache.commons.io.IOUtils;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

import java.io.*;
import java.text.ParseException;
import java.util.HashMap;
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
    
    private boolean mIsVerboseMode = false;
    private static final Logger mLog = Logger.getLogger(RangeQueryInterface.class.getCanonicalName());

	private DatabaseInterface mDbInterface = null;
	
	/** This constructor will be called when the REST service is called */ 
    public RangeQueryInterface(){
    	this(new DatabaseImplMongo(), true);
    }

    /**
     * for more detailed logging, use verbose = true in the constructor
     * @param isVerbose
     */
    public RangeQueryInterface(boolean isVerbose){
        this(new DatabaseImplMongo(), isVerbose);
    }

    /** This constructor can be used by test cases to pass in an implementation of the DatabaseInterface
     *  @param dbInterface  The implementation of the DatabaseInterface to use
     *  @param isVerbose  If true, turn on detailed logging */
    public RangeQueryInterface(DatabaseInterface dbInterface, boolean isVerbose) {
    	mDbInterface = dbInterface;
    	mIsVerboseMode = isVerbose;
    	setVerboseMode(isVerbose);
    }
    
    
    public void setVerboseMode(boolean isVerbose){
        LoaderPool.setReportingTrueAndResetRangePool(isVerbose);
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
    	File tempFileForTextAreaString = null;
    	RangeUploadResponse response = null;
    	try {
	        // Validate the interval name (names must contain only letters, numbers, and underscores, and can't already exist in the metadata)
	        validateName(workspace, intervalsName);
	
	        // Save the text area string to the temp file 
	        tempFileForTextAreaString = edu.mayo.ve.util.IOUtils.createTempFile();
	        saveStreamToFile(tempFileForTextAreaString, IOUtils.toInputStream(rangeSets));
	
	        // Validate the ranges in the text area - parse the intervals into 'rangeSets' to ensure that they are well formed
	        validateRangesInFile(tempFileForTextAreaString, "text area");
	        int numRangesInTextArea = edu.mayo.ve.util.IOUtils.countNonEmptyLines(tempFileForTextAreaString);
	        
	        // Save the file stream to a file
	        File tempFileForAllRanges = edu.mayo.ve.util.IOUtils.createTempFile();
	        saveStreamToFile(tempFileForAllRanges, uploadedInputStream);
	        
	        // Validate the ranges from the uploaded file
	        validateRangesInFile(tempFileForAllRanges, "uploaded file");
	        int numRangesInUploadedFile = edu.mayo.ve.util.IOUtils.countNonEmptyLines(tempFileForAllRanges);
	
	        // If there are no ranges defined in either the text area OR the file, then throw an exception
	        if ( (numRangesInTextArea + numRangesInUploadedFile) == 0)
	            throw new Exception("Error: Please specify at least one range in either the file or the text area.");
	
	        // Append the text area ranges to the end of the uploaded file so that both sets of ranges are in the same file
	        // WARNING: Make sure to prepend a newline before the new ranges in case the user chose a file that didn't have a newline at the end of it
	        edu.mayo.ve.util.IOUtils.appendToFile(tempFileForAllRanges, "\n" + rangeSets);

            mLog.info("Flagging the workspace as Annotating");
            mDbInterface.flagAsAnnotating(workspace);

            boolean isBackgroundProcess = isBackgroundProcess(workspace, tempFileForAllRanges);
	        applyRanges(workspace, tempFileForAllRanges, intervalsName, intervalDescription, isBackgroundProcess);
	
	    	response = new RangeUploadResponse(isBackgroundProcess);
    	} finally {
    		// Remove ONLY the file for the text area string.  The other temp file will be removed within the RangeWorker
    		if( tempFileForTextAreaString != null  &&  tempFileForTextAreaString.exists() )
    			tempFileForTextAreaString.delete();
    	}
        return response;
    }
    
    /** Determine whether the process should run in the background or foreground
     *  Run it as a background process if:
     *  	The file has > 20k variants AND the ranges cover more than 20k base pairs 
     * @throws ParseException 
     * @throws IOException */
    protected boolean isBackgroundProcess(String workspace, File tempFileForAllRanges) throws IOException, ParseException {
    	try {
	    	long variantCount = mDbInterface.getVariantCount(workspace);
	    	long bpCount = getBasePairCount(tempFileForAllRanges);
	    	return  (variantCount > getVariantCountThreshold()) && (bpCount > getBasePairThreshold());
    	}catch(Exception e) {
    		// If something happens here, we don't want to throw the exception up or it will be eternally "Annotating", 
    		// so force it to be a background process
    		return true;
    	}
	}

    
	protected void applyRanges(String workspaceKey, File rangesFile, String intervalName, String intervalDescription, boolean isBackgroundProcess) throws IOException, ProcessTerminatedException {
        //get the update frequency...
        int updateFrequency = getUpdateFrequency();

        // Create a task for running the range query update
        Task<HashMap,HashMap> task = getTask(workspaceKey, rangesFile, intervalName, intervalDescription, updateFrequency);
        
        // Determine whether it should run as a background process or stay interactive (background if > 20 ranges)
    	// update the workspace to include the new range set as a flag (intervals from form)
        if( isBackgroundProcess ) {
        	if (mIsVerboseMode) {mLog.info("The number of ranges exceeds the threshold, so running as a background process (adding to range worker pool).");}
	        addTaskToWorkerPool(task);
        } else {
        	if (mIsVerboseMode) {mLog.info("There are only a few ranges, so running interactively/synchronously.");}
        	new RangeWorker().compute(task);
        }
	}
	
	protected long getBasePairCount(File rangesFile) throws IOException, ParseException {
		BufferedReader fin = null;
		long bpCount = 0;
		try {
			fin = new BufferedReader(new FileReader(rangesFile));
			String line = null;
			while(  (line = fin.readLine()) != null ) {
				if( line.length() == 0 )
					continue;
				Range range = new Range(line);
				bpCount += (range.getMaxBP() - range.getMinBP() + 1);
			}
		} finally {
			try {
				if( fin != null )
					fin.close();
			}catch(Exception e) { }
		}
		return bpCount;
	}

	/** Save the input stream to a file */
    protected void saveStreamToFile(File fileToSaveTo, InputStream uploadedInputStream) throws IOException {
        if (mIsVerboseMode) {  mLog.info("Copying the interval file to the local filesystem: " + fileToSaveTo.getCanonicalPath()); }

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

    /** Get the update frequency from the sys.properties file */
    protected int getUpdateFrequency() throws IOException {
    	int freq = 1; // Default
    	try {
    		SystemProperties sysprop = new SystemProperties();
    		String ibsr = sysprop.get("INTERVAL_BULK_INSERT_RATE");
    		freq = Integer.parseInt(ibsr);
        } catch( Exception e ) {
            mLog.info("The update frequency for range/bed files is not defined in the sys.properties file.  Please define INTERVAL_BULK_INSERT_RATE.  For now it is set to 1 which could be slow");
        }
        return freq;
    }

    /** Get the variant count threshold for whether to run as a background process */
    protected int getVariantCountThreshold() throws IOException {
    	int variantThreshold = 20000; // Default
    	try {
    		SystemProperties sysprop = new SystemProperties();
    		String valStr = sysprop.get(Tokens.RANGE_QUERY_BACKGROUND_PROCESS_THRESHOLD_VARIANTS);
    		variantThreshold = Integer.parseInt(valStr);
        } catch( Exception e ) {
            mLog.info("The variant threshold for range query background process is not defined in the sys.properties file.  Please define "
            		+ Tokens.RANGE_QUERY_BACKGROUND_PROCESS_THRESHOLD_VARIANTS + ".  Defaulting to " + variantThreshold);
        }
        return variantThreshold;
    }

    /** Get the basepair count threshold for whether to run as a background process */
    protected int getBasePairThreshold() throws IOException {
    	int basePairThreshold = 500000; // Default
    	try {
    		SystemProperties sysprop = new SystemProperties();
    		String valStr = sysprop.get(Tokens.RANGE_QUERY_BACKGROUND_PROCESS_THRESHOLD_BASEPAIRS);
    		basePairThreshold = Integer.parseInt(valStr);
        } catch( Exception e ) {
            mLog.info("The base-pair threshold for range query background process is not defined in the sys.properties file.  Please define "
            		+ Tokens.RANGE_QUERY_BACKGROUND_PROCESS_THRESHOLD_BASEPAIRS + ".  Defaulting to " + basePairThreshold);
        }
        return basePairThreshold;
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
     * adds the task of inserting the interval as a new field to the range worker pool as a background process.
     * @throws IOException
     */
    public void addTaskToWorkerPool(Task task) throws IOException {
        WorkerPool pool = LoaderPool.getRangeWorkerPool();
        pool.addTask(task);
        pool.startTask(task.getId());
    }

    /**
     * @param workspaceKey  - the key for the workspace we are modifying
     * @param rangesFile  - bed/ tabix interval file that we get the intervals from
     * @param intervalName - the name of the new annotation to be added to INFO
     * @param intervalDescription - the description of the interval
     * @param updateFreq - for bulk insert, the number of records we should parse before sending the update to mongo
     * @throws IOException
     */
    public Task getTask(String workspaceKey, File rangesFile, String intervalName, String intervalDescription, int updateFreq) throws IOException{
        Task<HashMap,HashMap> task = new Task<HashMap,HashMap>();
        HashMap<String,String> fields = new HashMap<String,String>();
        fields.put(RangeWorker.INTERVAL_NAME, intervalName);
        fields.put(RangeWorker.INTERVAL_DESCRIPTION, intervalDescription);
        fields.put(RangeWorker.RANGE_FILE, rangesFile.getCanonicalPath());
        fields.put(RangeWorker.UPDATE_FREQ, String.valueOf(updateFreq));
        fields.put(Tokens.KEY,workspaceKey);
        task.setCommandContext(fields);
        return task;
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
            throw new Exception("Proposed intervals name is already in use: " + intervalsName);
        }
        
        //if no exceptions were thrown then it is good to go!
    }


    /**
     * Validate the range file by parsing it, looking for errors as it goes through it.
     * @param fileWithRanges
     * @param srcOfData  A string that will appear in the exception if a range cannot be parsed.  Ex: "text area" or "uploaded file"
     * @return
     * @throws IOException
     * @throws ParseException
     */
    public void validateRangesInFile(File fileWithRanges, String srcOfData) throws IOException, ParseException {
        if (mIsVerboseMode) {mLog.info("Parsing intervals in the file to ensure that they are all well formed");}

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
	            	// Try to parse the range
	                new Range(line);
	            }catch (ParseException pe){
	                throw new ParseException("Error: Range not valid (" + srcOfData + "). Line_Number: " + lineNum + ", line: " + line + "\n" + pe.getMessage(), 0);
	            }
	        }
        } finally {
        	if( br != null )
        	br.close();
        }
    }
}
