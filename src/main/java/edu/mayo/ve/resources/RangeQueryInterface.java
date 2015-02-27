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
    @Path("/workspace/{workspace}/name/{name}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadFile(
            @PathParam("workspace") String workspace,
            @FormDataParam("name") String intervalsName,
            @FormDataParam("intervalDescription") String intervalDescription,
            @FormDataParam("rangeSetText") String rangeSets,
            @FormDataParam("file") InputStream uploadedInputStream
    ) throws Exception {
        String response = "Workspace: " + workspace + " " + "name: " + intervalsName + " intervalDescription: " + intervalDescription + "\n rangeSetText: " + rangeSets + "\n";
        return Response.status(200).entity(response).build();
        //return uploadIntervalsFromFile(workspace, alias, uploadedInputStream);
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
     * @param n - send the bulk update every n ranges processed
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

}
