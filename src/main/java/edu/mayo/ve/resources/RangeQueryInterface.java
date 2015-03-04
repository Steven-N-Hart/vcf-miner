package edu.mayo.ve.resources;

import com.mongodb.*;
import com.sun.jersey.multipart.FormDataParam;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.VCFLoaderPool;
import edu.mayo.ve.message.Range;
import edu.mayo.ve.util.SystemProperties;
import org.apache.commons.io.IOUtils;

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

    DB db = MongoConnection.getDB();

    public RangeQueryInterface(){

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
        String response = "Workspace: " + workspace + " " + "name: " + intervalsName + " intervalDescription: " + intervalDescription + "\n rangeSetText: " + rangeSets + "\n";
        //validate the interval name (e.g. can't have period or other funky characters, can't already be used)

        // TODO: this is not working
        //String name = validate(intervalsName, workspace);
        String name = intervalsName;

        //copy the contents of the input stream to a temp file, this will allow us to validate that all of the intervals in the file are correctly formed.
        String uploadedFileLocation = getUploadFileLocation(workspace, name);
        File outputFile = new File(uploadedFileLocation);
        OutputStream outStream = new FileOutputStream(outputFile);
        try {
            // copy data to file system
            IOUtils.copyLarge(uploadedInputStream, outStream);
        } finally {
            outStream.close();
        }

        //parse the intervals into 'rangeSets' to ensure that they are well formed
        List<String> rangeLines = checkStrings(rangeSets);

        //parse the file to ensure that all of the intervals are well formed
        parseRangeFile(uploadedFileLocation);

        //get the update frequency...
        SystemProperties sysprop = new SystemProperties();
        String ibsr = sysprop.get("INTERVAL_BULK_INSERT_RATE");
        int n = 1; //default 1 if not defined
        if(ibsr != null && ibsr.length()<1){
            n = Integer.parseInt(ibsr);
        }

        //update the workspace to include the new range set as a flag (intervals from form)
        bulkUpdate(workspace,rangeLines.iterator(),n,name);

        //update the workspace to include the new range set as a flag (file intervals)
        File intervalFile = new File(uploadedFileLocation);
        BufferedReader br = new BufferedReader(new FileReader(intervalFile));
        bulkUpdate(workspace, new FileIterator(br), n, name);

        //update the metadata
        updateMetadata(workspace,name,intervalDescription);

        //delete the temp file
        outputFile.delete();

        return Response.status(200).entity(response).build();
        //return uploadIntervalsFromFile(workspace, alias, uploadedInputStream);
    }

    /**
     *
     * @param workspace    - the workspace that will get the metadata update
     * @param name         - the new name of the field
     * @param description  - the description of the new field
     */
    public void updateMetadata(String workspace, String name, String description) throws Exception {
        MetaData meta = new MetaData(); //front end interface to the metadata collections
        if(meta.checkFieldExists(workspace,name)){
            throw new Exception("Invalid Field Name!, it already exists.  FIELD: " + name + " KEY: " + workspace);
        }
        meta.updateInfoField(workspace,name,0,"Flag",description);

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
                Range r = new Range(line);
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
    public String validate(String s, String workspace) throws Exception {
        //first check to see that the metadata does not already contain a field with the same name, if it does -> invalid
        MetaData meta = new MetaData();
        if(meta.checkFieldExists(workspace, "HEADER.INFO." + s)==true){
            throw new Exception("Proposed Field Name is Already in use: " + s);
        }
        //next check that the name does not contain dot '.' and other funky characters if so -> invalid
        if(!s.matches("[a-z,A-Z,0-9,_]+")){
            throw new Exception("Proposed Field Name must contain only 0-9,A-Z,a-z: " + s);
        }
        //if it is valid, we can return the string, it is good to go!
        return s;
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
        SystemProperties sysprop = new SystemProperties();
        String tmpfile = sysprop.get("TEMPDIR") + "/" + alias + randInt(1,999999) + ".interval";
        File outputFile = new File(tmpfile);
        OutputStream outStream = null;
        try {
            outStream = new FileOutputStream(outputFile);
            // copy data to file system
            IOUtils.copyLarge(uploadedInputStream, outStream);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            outStream.close();
        }
        //check the file for any errors
        try {
            parseRangeFile(tmpfile);
        } catch (Exception e){
            //422 Unprocessable Entity (WebDAV; RFC 4918)
            //The request was well-formed but was unable to be followed due to semantic errors.
            String err = "The input ranges are not properly formed " + e.getMessage();
            return Response.status(422).entity(err).build();
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
     * parses the range file, looking for errors as it goes through it.
     * @param filename
     * @return
     * @throws IOException
     * @throws ParseException
     */
    public void parseRangeFile(String filename) throws IOException, ParseException {
        BufferedReader br = new BufferedReader(new FileReader(filename));
        String line = "";
        for(int i=0;(line = br.readLine()) != null;i++){
            try {
                Range r = new Range(line);
            }catch (ParseException pe){
                throw new ParseException("Line_Number: " + i + " Line_Content: " + line + "\n" + pe.getMessage(), 0);
            }
        }
        br.close();
    }

    /**
     * get back all records in the workspace (as a cursor) that overlap a range
     * @param workspace
     * @param range
     */
    public DBCursor queryRange(String workspace, Range range){
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        DBObject query = range.createQueryFromRange();
        DBCursor cursor = col.find(query);
        return cursor;
    }

    /**
     * count the number of records that intersect a given range
     * @param workspace
     * @param range
     * @return
     */
    public long count(String workspace, Range range){
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        DBObject query = range.createQueryFromRange();
        System.out.println("Query: " + query.toString());
        return col.count(query);
    }

    /**
     *
     * @param workspace - the workspace that we want to do the update on
     * @param rangeItter - an iterator that comes from a file or from a list of raw ranges
     * @param n - send the bulk update every n ranges processed  todo: change the update to use mongo's bulk interface (requires mongodb 2.6)
     * @param rangeSet - the validated name for the range set (e.g. it is not already a name in INFO)
     * @throws ParseException
     * @return number of records updated
     */
    public int bulkUpdate(String workspace, Iterator<String> rangeItter, int n, String rangeSet) throws ParseException {
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspace);
        int updateCount = 0;
        for(int i=0;rangeItter.hasNext(); i++){
            String next = rangeItter.next();
            Range range = new Range(next);
            DBObject query = range.createQueryFromRange(); //this is the select clause for records that will be updated

            //BasicDBObject set = new BasicDBObject("$set", new BasicDBObject().append( rangeSet, true));
            //col.update(query,set);
            System.out.println("Query: " + query.toString());



            BasicDBObject newDocument = new BasicDBObject();
            newDocument.append("$set", new BasicDBObject().append("INFO." + rangeSet, true));

            col.updateMulti(query,newDocument); //is there a faster way to do this? -- probably but lets get a base implementation in place first
            updateCount += col.count(query);

        }
        return updateCount;
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
