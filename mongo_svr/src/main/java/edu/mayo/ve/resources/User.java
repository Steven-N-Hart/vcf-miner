/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.*;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;

import javax.ws.rs.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;


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
        DB db = MongoConnection.getDB();
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
