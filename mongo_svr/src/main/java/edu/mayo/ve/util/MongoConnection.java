/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.util;

import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.mongodb.Mongo;
import edu.mayo.util.SystemProperties;

/**
 *
 * @author Daniel J. Quest
 * 
 * This class is a shared connection to MongoDB across the entire application
 */
public class MongoConnection {

    
    
    
    private static SystemProperties sysprop;
    private static Mongo mongo;
    static {
          init();
    }

    public synchronized static void init(){
        try {
            sysprop = new SystemProperties();
            //Mongo mongo = new Mongo();
            // or
            //Mongo mongo = new Mongo( "localhost" );
            // or
            mongo = new Mongo( sysprop.get("mongo_server") , new Integer(sysprop.get("mongo_port")) );
            //note you may need to copy sys.properties into your home directory to get this to work


        } catch (IOException ex) {
            Logger.getLogger(MongoConnection.class.getName()).log(Level.SEVERE, null, ex);
        }

    }

    public static Mongo getMongo() {
        return mongo;
    }

    public static SystemProperties getSysprop() {
        return sysprop;
    }
    
    
    
}
