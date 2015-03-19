package edu.mayo.ve.dbinterfaces;

import java.text.ParseException;
import java.util.Iterator;

import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import edu.mayo.util.MongoConnection;
import edu.mayo.util.Tokens;
import edu.mayo.ve.message.Range;
import edu.mayo.ve.resources.MetaData;

/** Separates the database and metadata interactions from the code.
 *  This is to allow a stub class that implements the same interface to be created for tests
 * @author Michael Meiners (m054457)
 *
 */
public class DatabaseImplMongo implements DatabaseInterface {

	
    private DB mMongoDb;
    private final String METADATA_INFO_HEADER_PREFIX = "HEADER.INFO.";
    // TODO: Why does the bulkUpdate use this prefix, while the code that checks the metadata uses the INFO_HEADER_PREFIX??????????????????
    private final String VARIANT_INFO_PREFIX        = "INFO.";
    
    public DatabaseImplMongo() {
    	mMongoDb = MongoConnection.getDB();
    }

	@Override
	public boolean isInfoFieldExists(String workspaceKey, String infoId) {
        MetaData meta = new MetaData(); //front end interface to the metadata collections
        return meta.checkFieldExists(workspaceKey, METADATA_INFO_HEADER_PREFIX + infoId);
	}

	@Override
	public void addInfoField(String workspaceKey, String infoId, int numOccurrences, String type, String description) {
    	MetaData meta = new MetaData();
        meta.updateInfoField(workspaceKey, infoId, 0, "Flag", description);
	}
	
	
	
    /**
    * Bulk update the variants collection with the ranges that are defined
    * @param workspaceKey - the workspace that we want to do the update on
    * @param rangeIterator - an iterator that comes from a file or from a list of raw ranges
    * @param numRangesGrouped - send the bulk update every n ranges processed  todo: change the update to use mongo's bulk interface (requires mongodb 2.6)
    * @param intervalsName - the validated name for the range set (e.g. it is not already a name in INFO)
    * @throws ParseException
    * @return number of records updated
    */
   public int bulkUpdate(String workspaceKey, Iterator<String> rangeIterator, int numRangesGrouped, String intervalsName) throws ParseException {
       DBCollection col = mMongoDb.getCollection(workspaceKey);
       int updateCount = 0;
       while( rangeIterator.hasNext() ){
           String next = rangeIterator.next();
           
           // Skip the line if it is blank
           if( next.trim().length() == 0 )
        	   continue;
           
           Range range = new Range(next);
           DBObject query = range.createQueryFromRange(); //this is the select clause for records that will be updated

           //BasicDBObject set = new BasicDBObject("$set", new BasicDBObject().append( rangeSet, true));
           //col.update(query,set);
           //System.out.println("Query: " + query.toString());

           BasicDBObject newDocument = new BasicDBObject();
           newDocument.append("$set", new BasicDBObject().append(VARIANT_INFO_PREFIX + intervalsName, true));

           col.updateMulti(query,newDocument); //is there a faster way to do this? -- probably but lets get a base implementation in place first
           updateCount += col.count(query);


           // increment by 1 since we're only doing 1 range at a time currently (no batch)
           incrementMetadataValue(workspaceKey, "annotation_count_current", 1);

           throw new ParseException("FAIL", 0);
       }
       return updateCount;
   }


    /**
     * get back all records in the workspace (as a cursor) that overlap a range
     * @param workspace
     * @param range
     */
    public DBCursor queryRange(String workspace, Range range){
        DBCollection col = mMongoDb.getCollection(workspace);
        DBObject query = range.createQueryFromRange();
        DBCursor cursor = col.find(query);
        return cursor;
    }

	
    /**
     * count the number of records that intersect a given range
     * @param workspace
     * @param range
     * @return
     */
    public long count(String workspace, Range range){
        DBCollection col = mMongoDb.getCollection(workspace);
        DBObject query = range.createQueryFromRange();
        System.out.println("Query: " + query.toString());
        return col.count(query);
    }

    @Override
    public void setMetadataValue(String workspace, String fieldName, int fieldValue){
        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspace);
        BasicDBObject update = new BasicDBObject();
        update.append("$set", new BasicDBObject().append(fieldName, fieldValue));
        MongoConnection.getDB().getCollection(Tokens.METADATA_COLLECTION).update(query, update);
    }

    @Override
    public void incrementMetadataValue(String workspace, String fieldName, int amount){
        BasicDBObject query = new BasicDBObject().append(Tokens.KEY, workspace);
        BasicDBObject update = new BasicDBObject();
        update.append("$inc", new BasicDBObject().append(fieldName, amount));
        MongoConnection.getDB().getCollection(Tokens.METADATA_COLLECTION).update(query, update);
    }
}
