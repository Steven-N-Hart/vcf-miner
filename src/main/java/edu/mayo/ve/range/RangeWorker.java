package edu.mayo.ve.range;

import edu.mayo.concurrency.exceptions.ProcessTerminatedException;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerLogic;
import edu.mayo.util.Tokens;
import edu.mayo.ve.dbinterfaces.DatabaseImplMongo;
import edu.mayo.ve.resources.MetaData;
import edu.mayo.ve.resources.RangeQueryInterface;

import edu.mayo.ve.util.IOUtils;
import org.apache.log4j.Logger;

import java.io.*;
import java.util.HashMap;

/**
 * Created by m102417 on 3/6/15.
 */
public class RangeWorker implements WorkerLogic {

    private static final Logger log = Logger.getLogger(RangeWorker.class);

    public static final String RANGE_FILE = "range_file";
    public static final String INTERVAL_NAME = "interval_name";
    public static final String INTERVAL_DESCRIPTION = "interval_description";
    public static final String UPDATE_FREQ = "update_freq";

    @Override
    public Object compute(Task t) throws ProcessTerminatedException {
        File intervalFile = null;
        if(verboseMode){ log.info("Updating ranges...  verboseMode:" + verboseMode );  }

        // Pull out the properties
        HashMap<String,String> context = (HashMap) t.getCommandContext();
        String workspace = context.get(Tokens.KEY);
        String loadfile = context.get(RANGE_FILE);
        String intervalName = context.get(INTERVAL_NAME);
        String intervalDesc = context.get(INTERVAL_DESCRIPTION);
        Integer updateFreq = Integer.parseInt(context.get(UPDATE_FREQ));
        
        MetaData meta = new MetaData();
        RangeQueryInterface rangeQ = new RangeQueryInterface();

        try {
            //update the workspace to include the new range set as a flag (file intervals)
            intervalFile = new File(loadfile);
            // TODO: br should be closed in finally clause
            BufferedReader br = new BufferedReader(new FileReader(intervalFile));

            //flag the workspace as queued
            log.info("Flagging the workspace as Annotating");
            meta.flagAsAnnotating(workspace);

            DatabaseImplMongo dim = new DatabaseImplMongo();

            // store total number of intervals
            int numIntervals = IOUtils.countNonEmptyLines(intervalFile);
            dim.setMetadataValue(workspace, "annotation_count_total", numIntervals);
            // initialize
            dim.setMetadataValue(workspace, "annotation_count_current", 0);

            log.info("Updating the range");
            dim.bulkUpdate(workspace, new FileIterator(br), updateFreq, intervalName);

            // update the metadata to include the new field  (NOTE: status will be set in the "finally" clause)
            log.info("Updating the metadata to include the new field: " + intervalName);
            meta.updateInfoField(workspace, intervalName, 0, "Flag", intervalDesc);
        } catch (Throwable e){

            log.error("Error updating ranges", e);

            // write stacktrace to the workspace errors log so the user can view it
            StringWriter stackTraceWriter = new StringWriter();
            e.printStackTrace(new PrintWriter(stackTraceWriter));
            try {
                IOUtils.writeToErrorFile(workspace, stackTraceWriter.toString());
                meta.updateErrorsAndWarningCounts(workspace);
            } catch (IOException ioe) {
                log.error(String.format("Error writing to workspace %s error file", workspace), ioe);
            }

            throw new ProcessTerminatedException();
        } finally {
            //delete the temp file if it is not null and it exists
        	// NOTE: This should only be done here within this thread as doing it in the parent thread will remove the file before it can be read!!!
            if( intervalFile != null  &&  intervalFile.exists() )
                intervalFile.delete();

            //need to flag the workspace as ready
            if(verboseMode){ log.info("Flagging the Workspace as ready"); }
            meta.flagAsReady(workspace);
        }

        return null;
    }

    private boolean verboseMode = false;
    public void setLogStackTrace(boolean on){
        verboseMode = on;
    }

    public boolean isVerboseMode() {
        return verboseMode;
    }

    public void setVerboseMode(boolean verboseMode) {
        this.verboseMode = verboseMode;
        if(verboseMode){ log.info("Verbose Mode is now turned on in RangeWorker"); }
    }
}
