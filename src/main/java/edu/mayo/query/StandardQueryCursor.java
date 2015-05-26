package edu.mayo.query;

import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import edu.mayo.ve.message.Querry;

/**
 * Created by m102417 on 5/26/15.
 */
public class StandardQueryCursor implements QueryCursorInterface{
    DBCollection col;
    Querry query;
    DBCursor cursor;

    public StandardQueryCursor(DBCollection col, Querry query){
        this.col = col;
        this.query = query;
        reset();
    }

    public void reset(){
        DBObject q = query.createQuery();
        cursor = col.find(q, query.getReturnSelect());
    }

    @Override
    public boolean hasNext() {
        return false;
    }

    @Override
    public DBObject next() {
        return null;
    }

    public Long countResults(){
        long count = col.count(query.createQuery());
        return count;
    }

    public DBCollection getCol() {
        return col;
    }

    public void setCol(DBCollection col) {
        this.col = col;
    }

    public String getQuery() {
        return query.toString();
    }

    public void setQuery(Querry query) {
        this.query = query;
    }
}
