package edu.mayo.ve.resources;


import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.text.ParseException;

import org.junit.Before;
import org.junit.Test;

import edu.mayo.ve.dbinterfaces.DatabaseImplStub;

public class RangeQueryInterfaceTest {

	private DatabaseImplStub mDbImplStub = null;
	private RangeQueryInterface mRangeQuery = null;
	
	@Before
	public void beforeEach() {
		mDbImplStub = new DatabaseImplStub();
		mRangeQuery = new RangeQueryInterface(mDbImplStub, true);
	}
	
    /** This unit test, will only test the regex in testValidate, this way it need not connect to Mongo.
	    Testing that the workspace exists and the field is not in use is covered by RangeITCase   */
	@Test
    public void testValidateName() throws Exception {
        String workspaceKey = "foo";
        mDbImplStub.addInfoField(workspaceKey, "Chrom1_100_to_1000", 0, "Flag", "Chromosome 1 from 100 to 1000");
        
        // These names are all ok
        assertTrue( isValidName("abc123ABC", 	workspaceKey));
        assertTrue( isValidName("a_c", 			workspaceKey));
        assertTrue( isValidName("123abc",		workspaceKey));
        
        // These are all bad (name cannot contain any character that is not a number, letter, or underscore)
        assertFalse(isValidName("ab.c", 		workspaceKey));
        assertFalse(isValidName("ab#c", 		workspaceKey));
        assertFalse(isValidName("a b c", 		workspaceKey));
        assertFalse(isValidName("Mike's", 		workspaceKey));
        
        // Bad - name already exists in database
        assertFalse(isValidName("Chrom1_100_to_1000", workspaceKey));
    }
	
	private boolean isValidName(String intervalsName, String workspace) {
		try {
			mRangeQuery.validateName(workspace, intervalsName);
            return true;
        }catch(Exception e){
        	return false;
        }
	}
	
    @Test (expected=FileNotFoundException.class)
    public void validateFileRanges_nonexistentFile() throws IOException, ParseException {
    	// Try with file that does not exist
    	mRangeQuery.validateRangesInFile(new File("/tmp/nonexistent.file"), "text area");
    	fail("Fail if it reached this far as the parser should throw a FileNotFoundException");
    }
    
    @Test
    public void validateFileRanges_emptyFile() throws IOException, ParseException {
    	// Try with file that has 0 bytes
    	File emptyFile = fromPath("/testData/emtpyFile.txt");
    	assertTrue( emptyFile.exists() );
    	// Should work ok - just no ranges to check
    	mRangeQuery.validateRangesInFile(emptyFile, "file upload");
    }

    
    /** Ex: "/testData/genes.bed" */
    private File fromPath(String relativePath) {
    	return new File( getClass().getResource(relativePath).getPath() );
    }
}