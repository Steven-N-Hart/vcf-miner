/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.util;

import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;

/**
 *
 * This class is to avoid the problem of multiple resources needing to create users
 * in a cyclic way.
 */
public class CreateUser {
    Mongo m = MongoConnection.getMongo();

    public void create_user(String username) {
        DB db = MongoConnection.getDB();
        DBCollection coll = db.getCollection( Tokens.USER_COLLECTION );
        DBObject user = coll.findOne(null);
        //if the user has created a workspace before
        if( user.containsField("workspaces") ){
            
        }
    }
    
}
