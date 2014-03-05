/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.resources;

import edu.mayo.ve.util.SystemProperties;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import java.net.UnknownHostException;
import java.util.Iterator;
import java.util.Set;

/**
 *
 * @author Daniel J. Quest
 */

// The Java class will be hosted at the URI path "/conf"
@Path("/ve/conf")
public class Conf {
    

    // The Java method will process HTTP GET requests
    @GET 
    // The Java method will produce content identified by the MIME Media
    // type "text/plain"
    @Produces("application/json")
    public String getClichedMessage() {
        String configuration = "{\n";
        try {
            int count = 0;
            // open the current configuration file
            SystemProperties sysprop = new SystemProperties();
            Set<String> properties = sysprop.propertySet();
            Iterator i = properties.iterator();
            while(i.hasNext()){
                String prop = (String) i.next();
                configuration += "\"" + prop + "\" : " + "\"" + sysprop.get(prop) + "\",\n";
                count++;
            }
            if(count > 0){
                configuration = configuration.substring(0,configuration.length()-2) + "\n";
            }
        } catch (IOException ex) {
            Logger.getLogger(Conf.class.getName()).log(Level.SEVERE, null, ex);
        }
        configuration += "}\n";
        return configuration;
    }
    

}
    
