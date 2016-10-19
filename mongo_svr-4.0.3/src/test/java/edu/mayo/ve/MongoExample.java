
package edu.mayo.ve;

import com.mongodb.Mongo;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.BasicDBObject;
import com.mongodb.Bytes;
import com.mongodb.DBObject;
import com.mongodb.DBCursor;
import com.mongodb.MongoException;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;
import java.io.IOException;
import java.net.UnknownHostException;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import com.mongodb.util.JSON;
import java.io.File;
import java.util.Iterator;
import java.util.List;
import org.bson.types.BSONTimestamp;

/**
 *
 * @author Daniel J. Quest
 */
public class MongoExample {
    private String host = "localhost";//"140.221.92.69";//"192.168.6.188"; //
    private int port = 27017;
    private String databasename = "test";//"workspace";//
    /**
     * getting a database connection...
     * 
     * 
     * Start the MongoDB JavaScript shell with:
       $ bin/mongo

       To switch databases, type:
       > use mydb
       switched to db mydb

     * Now in Java...
     */
    Mongo m = null;
    public DB connect(){
        DB db = null;
        try {
            m = new Mongo( host , port );
            db = m.getDB( databasename ); 
            System.out.println("Connected to Mongo");
        } catch (UnknownHostException ex) {
            Logger.getLogger(MongoExample.class.getName()).log(Level.SEVERE, null, ex);
        } catch (MongoException ex) {
            Logger.getLogger(MongoExample.class.getName()).log(Level.SEVERE, null, ex);
        }
        return db;
    }
    
    public boolean authenticate(String user, String password){
        DB db = connect();
        boolean auth = db.authenticate(user, password.toCharArray());
        return auth;
    }
    
    public void listDatabases(){
        System.out.println("list databases");
        // get db names
        for (String s : m.getDatabaseNames()) {
            System.out.println(s);
        }
    }
    
    public void listCollections(DB db){
        System.out.println("list collections");
        Set<String> colls = db.getCollectionNames();
        for (String s : colls) {
            System.out.println(s);
        }
    }
    
    public DBCollection getCollection(String collectionName, DB db){
        System.out.println("get collection");
        DBCollection coll = db.getCollection(collectionName);
        return coll;
    }

    public void demo1(DBCollection coll){
        System.out.println("demo1");
//> j = { name : "mongo" };
//{"name" : "mongo"}
        BasicDBObject j = new BasicDBObject();
        j.put("name", "Mongo");
//> t = { x : 3 };
//{ "x" : 3  }
        BasicDBObject t = new BasicDBObject();
        t.put("x", 3);
//> db.things.save(j);
        coll.save(j); //note the difference between save and insert 
                      // http://groups.google.com/group/mongodb-user/browse_thread/thread/b16bdd6579e5c3c9?pli=1
        
//> db.things.save(t);
        coll.save(t); 
//> db.things.find();
//{ "_id" : ObjectId("4c2209f9f3924d31102bd84a"), "name" : "mongo" }
//{ "_id" : ObjectId("4c2209fef3924d31102bd84b"), "x" : 3 }
//>
        DBCursor curs = coll.find();
        while(curs.hasNext()){
            System.out.println(curs.next().toString());
            // same thing is: System.out.println(curs.next());
        }
        
        return;
    }
    
    public void demo2(DBCollection coll){
        System.out.println("demo2");
        
//> for (var i = 1; i <= 20; i++) db.things.save({x : 4, j : i});
        for(int i = 1; i<=20; i++){
            BasicDBObject bo = new BasicDBObject();
            bo.put("x", 4);
            bo.put("j", i);
            coll.save(bo);
        }
//> db.things.find();
//{ "_id" : ObjectId("4c2209f9f3924d31102bd84a"), "name" : "mongo" }
//{ "_id" : ObjectId("4c2209fef3924d31102bd84b"), "x" : 3 }
//{ "_id" : ObjectId("4c220a42f3924d31102bd856"), "x" : 4, "j" : 1 }
//{ "_id" : ObjectId("4c220a42f3924d31102bd857"), "x" : 4, "j" : 2 }
//{ "_id" : ObjectId("4c220a42f3924d31102bd858"), "x" : 4, "j" : 3 }
//{ "_id" : ObjectId("4c220a42f3924d31102bd859"), "x" : 4, "j" : 4 }
//...
//note in javascript this stalls at 18 (buffer size) 
//to see it all do: 
//> var cursor = db.things.find();
//> while (cursor.hasNext()) printjson(cursor.next());
//or
//> db.things.find().forEach(printjson);
//in java it does not matter, just do this:
        DBCursor curs = coll.find();
        while(curs.hasNext()){
            System.out.println(curs.next().toString());
        }
        
//In the mongo shell, you can also treat cursors like an array :
//> var cursor = db.things.find();
//> printjson(cursor[4]);
//{ "_id" : ObjectId("4c220a42f3924d31102bd858"), "x" : 4, "j" : 3 }
//The java solution is not nearly as cool :(
//??????

    }
    
    public void findObjectGivenJSON(String JSONString, DBCollection col){
        System.out.println("findObjectGivenJSON");
        BasicDBObject bo = (BasicDBObject) JSON.parse(JSONString); //JSON2BasicDBObject
        DBCursor dbc = col.find(bo);
        System.out.println(dbc.next().toString());
    }
    
    public long countObjectsInCollection(DBCollection col){
        System.out.println("total # of documents: " + col.getCount());
        return col.getCount();
    }
    
    public void gridFSSaveExamp(DB myDatabase, String filename){
        try {
            /*
             * default root collection usage - must be supported
             */
            System.out.println("gridFSSaveExamp");
            GridFS myFS = new GridFS(myDatabase);              // returns a default GridFS (e.g. "fs" root collection)
            GridFSInputFile createFile = myFS.createFile(new File(filename));
            createFile.save();
            //myFS.storeFile(new File("/tmp/largething.mpg"));   // saves the file into the "fs" GridFS store
        } catch (IOException ex) {
            Logger.getLogger(MongoExample.class.getName()).log(Level.SEVERE, null, ex);
        }

    }

    
    public void gridFSListFiles(DB myDatabase){
        System.out.println("gridFSListFiles");
        GridFS myFS = new GridFS(myDatabase);
        System.out.println("*Bucket Name: " + myFS.getBucketName());
        DBCursor fileList = myFS.getFileList();
        System.out.println(fileList.size() + " files:");
        while(fileList.hasNext()){
            GridFSDBFile f = (GridFSDBFile) fileList.next();
            System.out.println("*" + f.getFilename());
        }
        
    }
    
    public void gridFSgetExamp(DB myDatabase, String filename){
        try {
            /*
             * specified root collection usage - optional
             */
            System.out.println("gridFSgetExamp");
            GridFS myFS = new GridFS(myDatabase, "contracts");             // returns a GridFS where  "contracts" is root
            GridFSDBFile findOne = myFS.findOne(filename);
            findOne.writeTo("/tmp"+filename+"2");
            //myFS.retrieveFile("smithco", new File("/tmp/smithco_20090105.pdf"));  // retrieves object whose filename is "smithco"
        } catch (IOException ex) {
            Logger.getLogger(MongoExample.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public void query1(DBCollection col){
        System.out.println("query1");
        //select * from things where name = "Mongo";
        //> db.things.find({name:"Mongo"}).forEach(printjson);
        //{ "_id" : ObjectId("4c2209f9f3924d31102bd84a"), "name" : "mongo" }
        String JSONString = "{\"name\":\"Mongo\"}";
        BasicDBObject bo = (BasicDBObject) JSON.parse(JSONString); //JSON2BasicDBObject
        DBCursor dbc = col.find(bo);
        while(dbc.hasNext()){
            System.out.println(dbc.next().toString());
        }
    }
    
    public void query2(DBCollection col){
        System.out.println("query2");
        //SELECT j FROM things WHERE x=4
        //> db.things.find({x:4}, {j:true}).forEach(printjson);
        //show an alternative way to construct the same sort of query as query1 (faster)
        BasicDBObject bo = new BasicDBObject();
        bo.put("x", 4);
        bo.put("j", new BasicDBObject("$exists", true));
        DBCursor dbc = col.find(bo);
        while(dbc.hasNext()){
            System.out.println(dbc.next().toString());
        }       
    }
    
    public void query3(DBCollection col){
        System.out.println("query3");
        // range query with multiple contstraings
        BasicDBObject decending = new BasicDBObject();
        decending.put("j", -1); // use 1 for accending
        BasicDBObject query = new BasicDBObject();
        query.put("j", new BasicDBObject("$gt", 2).append("$lte", 9)); // i.e. 20 < i <= 30
        DBCursor cur = col.find(query).sort(decending);
        while(cur.hasNext()) {
            System.out.println(cur.next());
        }
    }
    
    public void createAndCountIndex(DBCollection coll){
        System.out.println("createAndCountIndex");
        // create an index on the "j" field
        BasicDBObject dbo = new BasicDBObject("j", 1);
        coll.createIndex(dbo); // create index on "j", ascending


        // list the indexes on the collection
        List<DBObject> list = coll.getIndexInfo();
        for (DBObject o : list) {
            System.out.println(o);
        }
        
        //now drop the index
        coll.dropIndex(dbo);
    }
 
    public void testErrors(DB db){
        System.out.println("testErrors");
            // See if the last operation had an error
        System.out.println("Last error : " + db.getLastError());

        // see if any previous operation had an error
        System.out.println("Previous error : " + db.getPreviousError());

        // force an error
        db.forceError();

        // See if the last operation had an error
        System.out.println("Last error : " + db.getLastError());

        db.resetError();
    }

    //Trick to get the id of a newly inserted object...    
    //BasicDBObject obj = new BasicDBObject();
    //coll.save(obj);
    //ObjectId id = coll.get("_id"); 
    
    
    public void deleteCollection(DBCollection col){
        col.drop();
    }
    //drop a database
    //m.dropDatabase("com_mongodb_MongoAdmin");

    
    public static void main(String[] args){
        MongoExample mt = new MongoExample();
        DB db = mt.connect();
        mt.listDatabases();
        mt.listCollections(db);
        DBCollection col = mt.getCollection("things", db);
        mt.demo1(col);
        mt.demo2(col);
        mt.countObjectsInCollection(col);
        String json = "{ \"x\" : 4, \"j\" : 3 }";
        mt.findObjectGivenJSON(json, col);
        mt.query1(col);
        mt.query2(col);
        mt.query3(col);
        mt.createAndCountIndex(col);
        mt.testErrors(db);
        //gridfs
        mt.gridFSSaveExamp(db, "/tmp/test.txt");
        mt.gridFSListFiles(db);
        mt.gridFSgetExamp(db, "test.txt");
//        mt.deleteCollection(col);
//        DBCollection filescol = mt.getCollection("fs.files", db);
//        mt.deleteCollection(filescol);
//        DBCollection chunkscol = mt.getCollection("fs.chunks", db);
//        mt.deleteCollection(chunkscol);
    }
    
    
    
}
