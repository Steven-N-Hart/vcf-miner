package edu.mayo.ve.resources;

import com.mongodb.*;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;
import edu.mayo.index.Index;
import edu.mayo.ve.util.SystemProperties;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import java.io.IOException;

/**
 * Created by m102417 on 12/1/14.
 * REST calls for returning data found in the ##SAMPLE lines in the original VCF file.
 *
 *
 */
@Path("/SampleMeta")
public class SampleMeta {

    public static final String sample_meta_collection = "sample_meta_collection";
    public static final String sample_meta_key = "key"; //the 'key' for workspace ids

    @GET
    @Path("/{workspace_id}/")
    @Produces("application/json")
    public String getAllSampleNDocuments4Workspace(@PathParam("workspace_id") String workspaceID) throws IOException {
        return getAllSampleDocuments4WorkspaceImpl(workspaceID).toString();
    }

    public DBObject getAllSampleDocuments4WorkspaceImpl(String workspace) throws IOException {
        BasicDBObject ret = new BasicDBObject();
        BasicDBList results = new BasicDBList();
        //System.out.println("getWorkspaceJSON: " + userID);
        DB db = MongoConnection.getDB();
        SystemProperties sysprop = new SystemProperties();
        String samplemetacol = sysprop.get(sample_meta_collection);
        DBCollection col = db.getCollection(samplemetacol);
        BasicDBObject query = new BasicDBObject();
        query.put(Tokens.KEY,workspace);
        DBCursor cursor = col.find(query);
        while(cursor.hasNext()){
            DBObject o = cursor.next();
            results.add(o);
        }
        ret.append("results", results);
        return ret;
    }

    /**
     * indexes the ##sample collection based on 'key' so we can get the documents for a given VCF file rapidly
     * @return
     */
    public DBObject indexSampleDocuments() throws Exception {
        DB db = MongoConnection.getDB();
        SystemProperties sysprop = new SystemProperties();
        String samplemetacol = sysprop.get(sample_meta_collection);
        DBCollection col = db.getCollection(samplemetacol);
        Index indexer = new Index();
        return indexer.indexField(sample_meta_key, col);
    }


    /**
     * for a given workspace, delete all of the ##sample data
     * @param workspace
     */
    public WriteResult deleteSamples4Workspace(String workspace) throws IOException {
        DB db = MongoConnection.getDB();
        SystemProperties sysprop = new SystemProperties();
        String samplemetacol = sysprop.get(sample_meta_collection);
        DBCollection col = db.getCollection(samplemetacol);
        BasicDBObject query = new BasicDBObject();
        query.append(sample_meta_key, workspace);
        return col.remove(query);
    }
}
