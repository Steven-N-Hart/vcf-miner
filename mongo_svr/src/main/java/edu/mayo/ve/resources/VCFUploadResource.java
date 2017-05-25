package edu.mayo.ve.resources;


import java.io.*;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Pattern;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.google.gson.Gson;
import com.sun.jersey.multipart.FormDataParam;
import com.tinkerpop.pipes.util.Pipeline;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.concurrency.workerQueue.WorkerPool;
import edu.mayo.pipes.Factories.InputStreamBufferedReaderFactory;
import edu.mayo.pipes.UNIX.CatPipe;
import edu.mayo.pipes.iterators.Compressor;
import edu.mayo.securityuserapp.client.PermissionMgmtClient;
import edu.mayo.securityuserapp.client.ResourceMgmtClient;
import edu.mayo.securityuserapp.client.SessionExpiredClientException;
import edu.mayo.util.Tokens;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.LoaderPool;
import edu.mayo.util.SystemProperties;
import org.apache.commons.io.IOUtils;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 9/13/13
 * Time: 9:55 AM
 */
@Path("/")
public class VCFUploadResource {

    // regex designed to match the following
    // curl:    ------------------------------33c1b5daf26f
    // chrome:  ------WebKitFormBoundary7hlRzBzW9Byb5cB9
    // safari:  ------WebKitFormBoundaryfvB1PcYD46yOUCmU
    // firefox: -----------------------------9849436581144108930470211272
    private static Pattern dashHeaderRegex = Pattern.compile("[-]+\\w+\\s*");
    private int maxTypeAheadCache = 1000;
    private static boolean turnOffLoading = false;

    //define something incase sysproperties does not exist
    //public static final String UPLOAD_DIR = "/tmp";

    private SecurityUserAppHelper securityHelper;

    /**
     * Default constructor called by Jersey
     *
     * @throws IOException
     */
    public VCFUploadResource() throws IOException {
        this(new SecurityUserAppHelper(new SystemProperties()));
    }

    /**
     * Constructor
     *
     * @param helper
     */
    public VCFUploadResource(SecurityUserAppHelper helper) throws IOException {

        this.securityHelper = helper;

        SystemProperties sysprop = new SystemProperties();
        if(sysprop.get(Tokens.TYPE_AHEAD_OVERUN) != null){
            maxTypeAheadCache = new Integer(sysprop.get(Tokens.TYPE_AHEAD_OVERUN));  //user may even want to configure this paramater via REST, for now at least it is in a property file
        }
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String get() {
        return "Welcome to the REST Server! \nREST endpoints are ready and File Upload Resource Ready";
    }

    /**
     * service path
     * @return
     */
    @GET
    @Path("uploadvcf/turnOffLoading")
    @Produces(MediaType.TEXT_PLAIN)
    public String turnOffLoading() {
        turnOffLoading = true;
        return "Loading is turned off!";
    }

    /**
     * service path
     * @return
     */
    @GET
    @Path("uploadvcf/turnOnLoading")
    @Produces(MediaType.TEXT_PLAIN)
    public String turnOnLoading() {
        turnOffLoading = false;
        return "Loading is turned on!";
    }

    @POST
    @Path("uploadvcf/user/{user}/alias/{alias}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadFileNoReport(
            @PathParam("user") String user,
            @PathParam("alias") String alias,
            @HeaderParam("file-compression") String compression,
            @HeaderParam("usertoken") String userToken,
            @FormDataParam("file") InputStream uploadedInputStream
    ) throws Exception {
        if(reportingset == true){
            LoaderPool.reset(maxTypeAheadCache);
            reportingset = false;
        }
        return uploadFile(user,alias,"FALSE",compression,userToken,uploadedInputStream);
    }

    /**
     * The valid compression type output must be:
     * ".zip", ".gz", ".bgz", ".tgz", ".taz", ".cpgz", ".z", ".gzip", ".bz", ".bz2", ".tbz", ".tbz2"
     * @param input - the compression string sent in the http header under the key "file-compression"
     * @return
     */
    public String convertCompressionStringToValid(String input){
        if(input == null){
            input = "";
        }
        String valid = ""; //let the default be nothing
        if(!input.contains(".")){
            input = "." + input;
        }
        List<String> compressionTypes = Arrays.asList(".zip", ".gz", ".bgz", ".tgz", ".taz", ".cpgz", ".z", ".gzip", ".bz", ".bz2", ".tbz", ".tbz2");
        for(String t : compressionTypes){
            //System.out.println(valid + " : " + input);
            if(input.endsWith(t)){
                valid = t;
            }
            if(valid.length() > 0) break;
        }
        return valid;
    }

    /**
     *
     * @param fileroot     - location of the file
     * @param wkspID       - the workspace key
     * @param compression  - a valid (see convertCompressionStringToValid above) compression type e.g. .gz, .zip, ... (includes the dot)  the empty string is also a valid compression type if uncompressed
     * @return
     * @throws IOException
     */
    public String setUploadFileLocation(String fileroot, String wkspID, String compression) throws IOException {
        String validCompression = convertCompressionStringToValid(compression);
        if(System.getProperty("os.name").startsWith("Windows") ){
            //on a windows system, we don't want global tmp, or user specified temp, we want a directory relative to the install.
            String current = new java.io.File( "." ).getCanonicalPath();
            return current + "\\" + wkspID + validCompression;
        }
        String uploadedFileLocation = "";
        if(fileroot.endsWith("/"))
            uploadedFileLocation = fileroot + wkspID + validCompression;
        else
            uploadedFileLocation = fileroot + File.separator + wkspID + validCompression;
        return uploadedFileLocation;
    }

    /**
     * Collect basic statistics on the input file
     */
    public  HashMap<String,Integer> collectStatistics(String fileroot){
        HashMap<String,Integer> filecounts = new HashMap<String, Integer>();
        int comments = 0;
        int lines = 0;

        Pipeline p = new Pipeline(new CatPipe());
        p.setStarts(Arrays.asList(fileroot));
        while(p.hasNext()){
            String line = (String) p.next();
            lines++;
            if(line.startsWith("#")){
                comments++;
            }
        }
        filecounts.put(Tokens.TOTAL_LINE_COUNT, lines);
        filecounts.put(Tokens.HEADER_LINE_COUNT, comments);
        filecounts.put(Tokens.DATA_LINE_COUNT, lines-comments);

        return filecounts;
    }

    /**
     * Computes the Task object for a LoadWorker
     * @param filenamepath  -- the name of the VCF file we want to ETL into mongodb
     * @param json          -- the json returned from the provision operation
     * @return
     */
    public Task computeTask(String filenamepath, String json){
        HashMap workspaceMeta = gson.fromJson(json, java.util.HashMap.class);
        String wkspID =(String) workspaceMeta.get(Tokens.KEY);

        if(reporting){System.out.println("Collecting file statistics");}
        HashMap<String,Integer> filecounts =  collectStatistics(filenamepath);

        //schedule the ETL for load on the worker queue
        Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
        //add the file location of the load file to the new task
        workspaceMeta.put(Tokens.VCF_LOAD_FILE,filenamepath);
        //add the linecounts to the workspaceMeta object so the worker can access them
        for(String key : filecounts.keySet()){
            workspaceMeta.put(key, filecounts.get(key));
        }
        t.setCommandContext(workspaceMeta);
        return t;
    }


    private boolean reporting = false;
    /**
     * This version of process file assumes that the file is already on the filesystem.
     * This is used in the servelet version of the upload (see UploadVCFServelet
     * @param user
     * @param alias
     * @param reporting
     */
    public boolean processFile(String filenamepath, String compression, String user, String alias, boolean reporting, boolean deleteAfterLoad){
        reportingset = reporting;
        WorkerPool wp = LoaderPool.getWp();

        //figure out compression based on the filename

        if(reportingset){System.out.println("Loading: " + filenamepath);}

        if(reportingset){System.out.println("Trying to provision a new workspace. ");}
        String json = provision.provision(user, alias);

        Task t = computeTask(filenamepath, json);
        String workspace = ( (HashMap<String,String>)t.getCommandContext() ).get(Tokens.KEY);

        if(reportingset){System.out.println("Workspace provisioned with key: " + workspace);}
        //set the workspace's status to not ready
        if(reportingset){System.out.println("Setting the workspace status to not ready: ");}
        MetaData meta = new MetaData();
        meta.flagAsQueued(workspace);

        if(turnOffLoading==false){
            wp.addTask(t);           //this will add the UUID to the task
            wp.startTask(t.getId());
        }

        String output = "File uploaded and workspace constructed : " + json;
        if(reportingset){ System.out.println(output); }

        return true;  // it loaded correctly
    }

        private Gson gson = new Gson();
        private Provision provision = new Provision();
        //private String fileroot = "/tmp/";
        private boolean reportingset = false;
        @POST
        @Path("uploadvcf/user/{user}/alias/{alias}/{reporting}")
        @Consumes(MediaType.MULTIPART_FORM_DATA)
        public Response uploadFile(
                @PathParam("user") String user,
                @PathParam("alias") String alias,
                @PathParam("reporting") String reporting,
                @HeaderParam("file-compression") String compression,
                @HeaderParam("usertoken") String userToken,
                @FormDataParam("file") InputStream uploadedInputStream
           ) throws Exception {

            if(reporting.equalsIgnoreCase("TRUE")){
                if(reportingset == false){
                    LoaderPool.setReportingTrueAndResetPool(maxTypeAheadCache);
                }
                reportingset = true;
            }

            WorkerPool wp = LoaderPool.getWp();

            //System.out.println("Uploading VCF started! ");
            //provision a new workspace
            String json = provision.provision(user, alias);
            HashMap workspaceMeta = gson.fromJson(json, java.util.HashMap.class);
            String wkspID =(String) workspaceMeta.get(Tokens.KEY);

            try {
                securityHelper.registerWorkspace(user, userToken, wkspID, alias);
            } catch (SessionExpiredClientException sece) {
                // translate expired session to UNAUTHORIZED - 401
                throw new WebApplicationException(Response.Status.UNAUTHORIZED);
            }

            //set the workspace's status to not ready
            MetaData meta = new MetaData();
            meta.flagAsQueued(wkspID);
            String uploadedFileLocation = setUploadFileLocation(this.getFileRoot(), wkspID, compression);

            if(reportingset){
                System.out.println("Attempting to write file upload to the following location: " + uploadedFileLocation);
            }

            //add the filelocation to the hash for use in the Task later
            workspaceMeta.put(Tokens.VCF_LOAD_FILE,uploadedFileLocation);

            //add the workspace to the hash for use in the Task later
            workspaceMeta.put(Tokens.KEY, wkspID);

            //write file to temp space
            //HashMap<String,Integer> filecounts = writeFile(uploadedInputStream, uploadedFileLocation); //need to send this back if front end is to have a status bar...
            File outputFile = new File(uploadedFileLocation);
            OutputStream outStream = new FileOutputStream(outputFile);
            try {
                // copy data to file system
                IOUtils.copyLarge(uploadedInputStream, outStream);
            } finally {
                outStream.close();
            }

            //collect statistics on the input file...
            HashMap<String,Integer> filecounts = this.collectStatistics(uploadedFileLocation);

            if(turnOffLoading==false){
                //schedule the ETL for load on the worker queue
                Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
                //add the linecounts to the workspaceMeta object so the worker can access them
                for(String key : filecounts.keySet()){
                    workspaceMeta.put(key, filecounts.get(key));
                }
                t.setCommandContext(workspaceMeta);
                wp.addTask(t);           //this will add the UUID to the task
                wp.startTask(t.getId());
            }

            String output = "File uploaded and workspace constructed : " + json;
            return Response.status(200).entity(output).build();

        }

        public HashMap<String,Integer> writeFile(InputStream httpstream, String uploadedFileLocation) throws IOException {
            //make sure to normalize the suffix befor you use this call! (look inside the factory for what is acceptable.
            BufferedReader brIN = InputStreamBufferedReaderFactory.constructBufferedReader(httpstream, uploadedFileLocation, this.reportingset);
            File file = new File(uploadedFileLocation);
            if (!file.exists()) {
                file.createNewFile();
            }
            //FileWriter fw = new FileWriter(file.getAbsoluteFile());
            //BufferedWriter out = new BufferedWriter(fw);
            Compressor utilityKnife = new Compressor(null, file); //input file is null - that is read over http, output is whatever compression type.
//
//            GZIPInputStream gzin = new GZIPInputStream(httpstream);
//            Reader decoder = new InputStreamReader(gzin, "UTF-8");
//            BufferedReader br = new BufferedReader(decoder);
            //check to see the type of compression of the source file...
            //String compressionShorthand = this.convertCompressionStringToValid(uploadedFileLocation);
            return writeFile(brIN, utilityKnife.getWriter());
        }



    /**
     * writes a temporary file, recording the totallinecount, datalinecount and the headerlinecount
     * @param br
     * @param out
     * @return
     * @throws IOException
     */
    public HashMap<String,Integer> writeFile(BufferedReader br,
                                             BufferedWriter out ) throws IOException {
        HashMap<String,Integer> ret = new HashMap<String, Integer>();

        int linecount = 0;
        int headerCount = 0;
        int dataCount = 0;
        boolean datawritten = false;

        String line = "";
        boolean isHeader = true;
        boolean first = true;
        String last = "";
        String dashToken = ""; //e.g. ------------------------------993cc4c6faad
        if(writeDirect){ writeFileDirect(br, out);  }
        else {
            while((line = br.readLine()) != null){
                //grab the dashToken
                if(dashToken.length() < 2 && dashHeaderRegex.matcher(line).matches()){
                    dashToken = line.trim();
                    if(reportingset) System.out.println(String.format("Found dash-header: %s", dashToken));
                }else {
                    //if it is the first line, and there is no dash token, then there is no header, so write the data raw
                    isHeader = false;
                    first = false;
                    dashToken = "THERE_APPEARS_TO_BE_NO_HTTP_HEADER!";
                }
                //if we are at the footer, break the loop
                if(line.startsWith(dashToken) && last.length() < 1 && !isHeader){
                    break;
                }else {
                    if(!isHeader && !first){
                        //send the first twenty lines to the log if reporting was requested
                        if(reportingset && linecount < 20){
                            System.out.println(last);
                            datawritten = true;
                        }
                        //if the line is not blank, then write it (blank lines are ignored)
                        if(last.trim().length() > 1){
                            out.write(last);
                            out.write("\n");
                            linecount++;
                            if(last.startsWith("#")){
                                headerCount++;
                            }else {
                                dataCount++;
                            }
                        }
                    }else if(!isHeader)
                        first = false;
                }
                if(isHeader && line.length() == 0){
                    isHeader = false;
                }
                last = line;
            }
        }
        //if we still have one last line to write
        if(!last.startsWith(dashToken) && last.length() > 1 && !last.equals(line)){
            out.write(last);
            out.write("\n");
            linecount++;
            dataCount++;
        }
        br.close();
        out.flush();
        out.close();
        if(reportingset && !datawritten){
            System.out.println("Error!  no data was written on this load!");
        }
        //record basic statistics about the file...
        if(reportingset){
            System.out.println("Linecount : " + linecount);
            System.out.println("headerCount : " + headerCount);
            System.out.println("dataCount : " + dataCount);
        }
        ret.put(Tokens.TOTAL_LINE_COUNT, linecount);
        ret.put(Tokens.HEADER_LINE_COUNT, headerCount);
        ret.put(Tokens.DATA_LINE_COUNT, dataCount);
        return ret;
    }



    /**
     * if we want the file complete with headers (usually for debugging purposes)
     */
    private static boolean writeDirect = false;
    public void writeFileDirect(BufferedReader br, BufferedWriter out ) throws IOException {
        String line;
        while((line = br.readLine()) != null){
            out.write(line);
            out.write("\n");
        }
        return;
    }

    /**
     * service path
     * @return
     */
    @GET
    @Path("uploadvcf/writeFileDirectOn")
    @Produces(MediaType.TEXT_PLAIN)
    public String writeFileDirectOn() {
        writeDirect = true;
        return "writeFileDirect is turned on!";
    }

    /**
     * service path
     * @return
     */
    @GET
    @Path("uploadvcf/writeFileDirectOff")
    @Produces(MediaType.TEXT_PLAIN)
    public String writeFileDirectOff() {
        writeDirect = false;
        return "writeFileDirect is turned off!";
    }

    public String getFileRoot(){
        SystemProperties sysprop;
        try {
            sysprop = new SystemProperties();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        if(sysprop.get("TEMPDIR") != null){
            return sysprop.get("TEMPDIR");
        }
        else {
            throw new RuntimeException("TEMPDIR not defined in your sys.properties file or sys.properties does not exist");
        }
    }

    private ResourceMgmtClient getResourceMgmtClient() {
        return null;
    }

    private PermissionMgmtClient getPermissionsMgmtClient() {
        return null;
    }

}