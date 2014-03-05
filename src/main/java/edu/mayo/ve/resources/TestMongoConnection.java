/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import com.mongodb.Mongo;
import edu.mayo.ve.util.MongoConnection;
import edu.mayo.ve.util.SystemProperties;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

/**
 *
 * @author m102417
 */
@Path("/ve/mongo")
public class TestMongoConnection {
    Mongo m = MongoConnection.getMongo();

    // The Java method will process HTTP GET requests
    @GET 
    // The Java method will produce content identified by the MIME Media
    // type "text/plain"
    @Produces("application/json")
    public String getClichedMessage() {
        Mongo m = MongoConnection.getMongo();
        return m.getDatabaseNames().toString()+"\n";
    }
    
}
