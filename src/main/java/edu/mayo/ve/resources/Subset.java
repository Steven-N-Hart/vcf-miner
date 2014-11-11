package edu.mayo.ve.resources;

import com.google.gson.Gson;
import edu.mayo.concurrency.workerQueue.Task;
import edu.mayo.securityuserapp.client.SessionExpiredClientException;
import edu.mayo.util.SystemProperties;
import edu.mayo.util.Tokens;
import edu.mayo.ve.SecurityUserAppHelper;
import edu.mayo.ve.VCFParser.LoadWorker;
import edu.mayo.ve.VCFParser.VCFParser;
import edu.mayo.ve.message.QuerryDownload;
import edu.mayo.ve.message.SubsetInfo;
import org.apache.commons.beanutils.BeanUtils;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 *
 */
@Path("/ve")
public class Subset {

    private SecurityUserAppHelper securityHelper;
    private Gson gson = new Gson();
    private Provision provision = new Provision();
    private MetaData meta = new MetaData();
    private DownloadVCF downloadVCF = new DownloadVCF();
    private VCFUploadResource uploadResource = new VCFUploadResource();

    /**
     * Default constructor called by Jersey
     *
     * @throws java.io.IOException
     */
    public Subset() throws IOException {
        this(new SecurityUserAppHelper(new SystemProperties()));
    }

    /**
     * Constructor
     *
     * @param helper
     *      A {@link SecurityUserAppHelper} that provides access to security infrastructure.
     */
    public Subset(SecurityUserAppHelper helper) throws IOException {
        this.securityHelper = helper;
    }

    /**
     * Performs a subset operation on the given workspace.
     *
     * @param subsetInfo
     *      A {@link SubsetInfo} that contains information about the user's query and any
     *      selected samples
     * @param workspaceKey
     *      The key of the workspace to perform the subset on.
     * @param user
     *      The name of the user performing the operation.
     * @param alias
     *      The name of the new workspace being created.
     * @param userToken
     *      The security token for the user's session.
     * @return
     *      The key of the newly created workspace.
     * @throws Exception
     */
    @POST
    @Path("subset/workspace/{workspace}/user/{user}/alias/{alias}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response subset(
            SubsetInfo subsetInfo,
            @PathParam("workspace") String workspaceKey,
            @PathParam("user") String user,
            @PathParam("alias") String alias,
            @HeaderParam("usertoken") String userToken
    ) throws Exception {

        // Create new empty workspace for subset vcf
        String json = provision.provision(user, alias);
        HashMap workspaceMeta = gson.fromJson(json, java.util.HashMap.class);
        final String subsetWorkspaceKey = (String) workspaceMeta.get(Tokens.KEY);
        workspaceMeta.put(Tokens.KEY, subsetWorkspaceKey); //add to hash for use in the Task

        // set permissions on new empty workspace
        try {
            securityHelper.registerWorkspace(user, userToken, subsetWorkspaceKey, alias);
        } catch (SessionExpiredClientException sece) {
            // translate expired session to UNAUTHORIZED - 401
            throw new WebApplicationException(Response.Status.UNAUTHORIZED);
        }

        //set the workspace's status to QUEUED
        meta.flagAsQueued(subsetWorkspaceKey);

        // TODO: fix temp space location
        File exportVCF = new File(String.format("/tmp/%s", workspaceKey + "_export.vcf"));
        final String exportFileLocation = exportVCF.getAbsolutePath();

        QuerryDownload querryDownload = new QuerryDownload();
        BeanUtils.copyProperties(querryDownload, subsetInfo.getQuerry()); // transfer properties
        querryDownload.setSelectedSamples(subsetInfo.getSamples());


        // Apply query to existing set and extract the subset
        // in a vcf in temp space (can use new code for vcf extraction).
        // TODO: should be done in a separate thread.
        downloadVCF.writeVCF(new FileOutputStream(new File(exportFileLocation)), querryDownload);

        // add the file location to the hash for use in the Task later
        workspaceMeta.put(Tokens.VCF_LOAD_FILE, exportFileLocation);

        // collect statistics on the input file...
        Map<String,Integer> filecounts = uploadResource.collectStatistics(exportFileLocation);

        //schedule the ETL for load on the worker queue
        Task<HashMap,HashMap> t = new Task<HashMap,HashMap>();
        // add the linecounts to the workspaceMeta object so the worker can access them
        for(String key : filecounts.keySet()){
            workspaceMeta.put(key, filecounts.get(key));
        }
        t.setCommandContext(workspaceMeta);

        // Take the temp space VCF and load into new workspace.
        // TODO: switch this to multi-threaded
        LoadWorker lw = new LoadWorker(new VCFParser(), 100000);
        lw.compute(t);

        // TODO: Need Dan's help here to get this working.
        // observed that "meta" collection has an entry, but nothing in "workspace" collection
//        WorkerPool wp = VCFLoaderPool.getWp();
//        wp.addTask(t);           //this will add the UUID to the task
//        wp.startTask(t.getId());

        // TODO: If any of the steps fail, set workspace to error state, delete temp vcf.
        return Response.status(200).entity(subsetWorkspaceKey).build();
    }

}
