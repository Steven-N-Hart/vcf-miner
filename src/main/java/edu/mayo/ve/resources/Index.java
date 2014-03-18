package edu.mayo.ve.resources;

import com.mongodb.*;
import edu.mayo.util.MongoConnection;
import edu.mayo.ve.util.Tokens;

import javax.ws.rs.*;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 11/12/13
 * Time: 9:39 AM
 * This class allows the user to index specific fields in the workspace... very helpful for queries that are slow/non-responsive
 */
@Path("/ve/index")
public class Index {
    Mongo m = MongoConnection.getMongo();
    edu.mayo.index.Index index = new edu.mayo.index.Index(); //this is the index utility class

    @GET
    @Path("/createFieldIndex/{workspaceid}/f/{field}")
    @Produces("application/json")
    public String createFieldIndex(@PathParam("workspaceid") String workspaceID, @PathParam("field") String field) {
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(workspaceID);
        return index.indexField(field, col).toString();
    }

    @GET
    @Path("/dropFieldIndex/{workspaceid}/f/{field}")
    @Produces("application/json")
    public String dropFieldIndex(@PathParam("workspaceid") String workspaceID, @PathParam("field") String field) {
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(workspaceID);
        return index.dropIndexField(field,col).toString();
    }

    @GET
    @Path("/getIndexes/{workspaceid}")
    @Produces("application/json")
    public String getIndexes(@PathParam("workspaceid") String workspaceID) {
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(workspaceID);
        return index.getIndexedFields(col).toString();
    }

    /**
     *
     * @param workspaceID
     * @return -- all operations and status for the given workspace
     */
    @GET
    @Path("/getOperations/{workspaceid}")
    @Produces("application/json")
    public String getOperations(@PathParam("workspaceid") String workspaceID) {
        return index.getStatus4opsOnWorkspace(workspaceID).toString();
    }


}
