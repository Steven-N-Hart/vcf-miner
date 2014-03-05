/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.WriteResult;
import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import com.mongodb.Mongo;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.DBCursor;
import com.mongodb.util.JSON;
import edu.mayo.ve.util.CreateUser;
import edu.mayo.ve.util.MongoConnection;
import java.net.UnknownHostException;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.PUT;
import javax.ws.rs.PathParam;

import edu.mayo.ve.util.Tokens;
import org.bson.types.ObjectId;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;


/**
 *
 * @author Daniel Quest
 * This class helps users manage workspaces... and provides ease of use 
 * 
 * { 
 * "userid" : "danquest",
 * "oauth"  : "abc123"
 * "workspaces" : {
 *      "w21dd8db6d0c13d09aa4151bd4dfd8c832d57c1a3" : {"alias" : "workspace1", "perms" : "R"},
 *      "w360df574022097b920202483bcf099261dc1f7"   : {"alias" : "workspace2", "perms" : "W"},
 *      "w360df574022097b920202483bcf099261dc1f7ab" : {"alias" : "silly_workspace", "perms" : "W"}
 *  }
 * }
 * 
 */
@Path("/user")
public class User {
    
    Mongo m = MongoConnection.getMongo();

    /**
     * get all users that are listed in the metadata collection
     * @return   List of usernames
     */
    public List<String> getAllUsersFromMeta(){
        HashSet<String> allUsers = new HashSet<String>();
        DB db = m.getDB(Tokens.WORKSPACE_DATABASE);
        DBCollection col = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject everything = new BasicDBObject();
        BasicDBObject returnUsersOnly = new BasicDBObject();
        returnUsersOnly.put(Tokens.OWNER,1);
        for (DBObject next : col.find(everything, returnUsersOnly)) {
            String user = (String) next.get(Tokens.OWNER);
            //System.out.println(user);
            allUsers.add(user);
        }
        return new ArrayList<String>(allUsers);
    }

    public static void main(String[] args){
        User u = new User();
        u.getAllUsersFromMeta();
    }


    
    //create workspace by alias
//    @Path("/{ownerid}/a/{alias}")
//    public String provisionByAlias(@PathParam("ownerid") String ownerID, @PathParam("alias") String alias ) {
//        Provision p = new Provision();
//        String provision = p.provision(ownerID);
//        System.out.println(provision);
//        return provision;
//    }
    //list workspaces owned by a user
    //list users
    //list alias names
    //given workspace_id give back alias
    //change alias
    //provide access to a workspace by alias
    
//    public void create_user(String username){
//        CreateUser cu = new CreateUser();
//        cu.create_user(username);
//    }
    
}
