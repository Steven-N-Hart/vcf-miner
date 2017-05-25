package edu.mayo.ve.range;

import java.io.BufferedReader;
import java.util.Iterator;

/**
 * simple class that allows a Buffered Reader to act like an iterator...
 */
public class FileIterator implements Iterator<String>
{
    BufferedReader reader;
    public FileIterator(BufferedReader myReader) { reader = myReader; };
    @Override
    public boolean hasNext() { try { return reader.ready(); }catch(Exception e){ throw new RuntimeException(e); } };
    @Override
    public String next() { try { return reader.readLine(); }catch(Exception e){ throw new RuntimeException(e); } };
    @Override
    public void remove() { throw new RuntimeException("Remove not supported!"); };
}