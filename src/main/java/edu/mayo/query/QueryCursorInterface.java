package edu.mayo.query;

import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import edu.mayo.ve.message.Querry;

/**
 * Created by m102417 on 5/26/15.
 */
public interface QueryCursorInterface {

    /**
     *
     * @return if the cursor has more elements
     */
    public boolean hasNext();

    /**
     * @return the next DBObject from the cursor
     */
    public DBObject next();

    /**
     * Need to throw an exception here, because some implementations need to throw exceptions.
     * @return the number of results in the database that match the querry object
     */
    public Long countResults() throws Exception;

    /**
     * reset the internal state of the cursor so that it starts at the top of the result set again
     * @return
     */
    public void reset();

    public DBCollection getCol();
    public void setCol(DBCollection col);
    public String getQuery();
    public void setQuery(Querry query);

}
