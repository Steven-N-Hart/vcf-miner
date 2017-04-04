package edu.mayo.ve.resources;


import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.text.ParseException;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import edu.mayo.ve.dbinterfaces.DatabaseImplStub;
import edu.mayo.ve.util.IOUtils;

public class RangeQueryInterfaceTest {

	@Rule
	public TemporaryFolder mTempFolder = new TemporaryFolder();
	
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
    
    @Test
    public void validateRanges_allGood() throws IOException, ParseException {
    	// These should all be valid ranges:
    	String ranges = concatLines(
    			"22:0-100",
    			"chr22:14-15 a b c d e f g h i",
    			"X:15-16 a b c d",
    			"chrY 16 17",
    			"chM,17,18",
    			"22:18 19",
    			"22 19 20",
    			"22 20-21",
    			"22  20 - 21",
    			"22 : 20 - 21",
    			"22 : 20, 21",
    			"22:16050400 16050410",
    			"22:16050410,16050500",
    			"22-16050410-16050500",
    			"22\t16050410\t16050500"
    			);
    	validateRanges(ranges);
    }
    
    @Test
    public void validateRanges_bad() throws IOException, ParseException {
    	assertFalse( isRangeOk("1") );
    	assertFalse( isRangeOk("1 2") );
    	assertFalse( isRangeOk("1 2 ") );
    	assertFalse( isRangeOk("1 2 a") );
    	assertFalse( isRangeOk("1_2_3") );
    	assertFalse( isRangeOk("# chrM 2 3") );
    }
    
    
    @Test
    public void fileAppend() throws IOException {
    	String ranges1 = concatLines("1 100-200", "2 200-300", "3 300-400");
    	String ranges2 = concatLines("4 400-500", "5 500-600");
    	File tempFile = mTempFolder.newFile();
    	// Write the first ranges to the file
    	mRangeQuery.saveStreamToFile(tempFile, org.apache.commons.io.IOUtils.toInputStream(ranges1));
    	// Now append the second set of ranges
    	IOUtils.appendToFile(tempFile, "\n" + ranges2);
    	// Verify the file output
    	FileInputStream fin = new FileInputStream(tempFile);
    	String actual = org.apache.commons.io.IOUtils.toString(fin);
    	fin.close();
    	String expected = concatLines(ranges1, ranges2);
    	assertEquals(expected, actual);
    }
    
    @Test
    public void fileAppend_range1Blank() throws IOException {
    	String ranges1 = "";
    	String ranges2 = concatLines("4 400-500", "5 500-600");
    	File tempFile = mTempFolder.newFile();
    	// Write the first ranges to the file
    	mRangeQuery.saveStreamToFile(tempFile, org.apache.commons.io.IOUtils.toInputStream(ranges1));
    	// Now append the second set of ranges
    	IOUtils.appendToFile(tempFile, "\n" + ranges2);
    	// Verify the file output
    	FileInputStream fin = new FileInputStream(tempFile);
    	String actual = org.apache.commons.io.IOUtils.toString(fin);
    	fin.close();
    	// Expected should start with a newline
    	String expected = concatLines(ranges1, ranges2);
    	assertEquals(expected, actual);
    }

    @Test
    public void fileAppend_range1HasNewlineAtEnd() throws IOException {
    	String ranges1 = "1 2-3\n";
    	String ranges2 = concatLines("4 400-500", "5 500-600");
    	File tempFile = mTempFolder.newFile();
    	// Write the first ranges to the file
    	mRangeQuery.saveStreamToFile(tempFile, org.apache.commons.io.IOUtils.toInputStream(ranges1));
    	// Now append the second set of ranges
    	IOUtils.appendToFile(tempFile, "\n" + ranges2);
    	// Verify the file output
    	FileInputStream fin = new FileInputStream(tempFile);
    	String actual = org.apache.commons.io.IOUtils.toString(fin);
    	fin.close();
    	// Expected should have two newlines in between the first and second set of ranges
    	String expected = concatLines(ranges1, ranges2);
    	assertEquals(expected, actual);
    }

    
    @Test
    public void bpCount() throws IOException, ParseException {
    	assertEquals(2,    countBasePairs("1 1-2"));
    	assertEquals(101,  countBasePairs("1 100-200"));
    	assertEquals(202,  countBasePairs(concatLines("1 100-200", "1 150-250")));
    	assertEquals(11014,countBasePairs(concatLines("chrX 1000 2000", "chrX 10000 20000", "chrY 1 2", "chrM 1 10")));
    }
    
    /** Save ranges to file, then use the RangeQueryInterface.getBasePairCount() method to count them 
     * @throws IOException 
     * @throws ParseException */
    private long countBasePairs(String ranges) throws IOException, ParseException {
    	File tempFile = mTempFolder.newFile();
    	IOUtils.appendToFile(tempFile, ranges);
    	long count = mRangeQuery.getBasePairCount(tempFile);
    	return count;
    }
    
    @Test
    public void countBasePairsInFile() throws IOException, ParseException {
    	File allGenesFile = fromPath("/testData/genes.bed");
    	long count = mRangeQuery.getBasePairCount(allGenesFile);
    	assertEquals(1406090664, count);
    }
    
    
    @Test
    public void isBackgroundProcess() throws IOException, ParseException {
    	// NOTE: Default for background process is: 20k variants, 500k base-pairs
    	
    	// NOT Background - variant count < threshold;  range base pair count < threshold
    	assertFalse( isBackground(1, "1 1000-2000") );
    	// NOT Background - variant count < threshold;  range base pair count > threshold
    	assertFalse( isBackground(1, "1 1-2000000") );
    	// NOT Background - variant count > threshold;  range base pair count < threshold
    	assertFalse( isBackground(100000, "1 10000-20000") );
    	// NOT Background - variant count = threshold;  range base pair count = threshold
    	assertFalse( isBackground(20000, "1 1-500000") );
    	
    	// YES Background - variant count =threshold+1; range base pair count = threshold+1
    	assertTrue( isBackground(20001, "1 1-500001") );
    	// YES Background - variant count > threshold;  range base pair count > threshold; range count < threshold
    	assertTrue( isBackground(2000000000, concatLines("1 1-20000", "1 1-400000", "2 1000000-1060000", "3 1-50000")) );
    	
    	// YES Background - variant count < threshold; range base pair count < threshold; **range count > threshold**
    	assertTrue( isBackground(100, generateRanges(101, 400000)) );
    	
    	// YES Background - variant count > threshold; range base pair count > threshold; range count > threshold
    	assertTrue( isBackground(21000, generateRanges(1000, 600000)) );
    }
    
    private String generateRanges(int numRanges, long numBasePairs) {
    	StringBuilder str = new StringBuilder();
    	for(int i=0; i < numRanges; i++) {
    		long range = numBasePairs/numRanges;
    		long start = (i*range)+1;
    		long end   = (i*range)+range;
    		str.append("1 " + start + "-" + end + "\n");
    	}
    	return str.toString();
    }
    
    
    private boolean isBackground(int variantCount, String ranges) throws IOException, ParseException {
    	// Set the variant count in the database stub
    	((DatabaseImplStub)mDbImplStub).setVariantCount(variantCount);

    	// Save the ranges to a temp file
    	File tempFile = mTempFolder.newFile();
    	IOUtils.appendToFile(tempFile, ranges);
    	
    	// Check if it should be a background process
    	int numRanges = edu.mayo.ve.util.IOUtils.countNonEmptyLines(tempFile);
    	return mRangeQuery.isBackgroundProcess("w11111111", tempFile, numRanges);
	}

	protected boolean isRangeOk(String range) {
    	try {
    		validateRanges(range);
    		return true;
    	} catch(Exception e) {
    		return false;
    	}
    }
    
    protected void validateRanges(String ranges) throws IOException, ParseException {
    	File tempFile = mTempFolder.newFile();
    	IOUtils.appendToFile(tempFile, ranges.toString());
    	mRangeQuery.validateRangesInFile(tempFile, "file");
    }
    


    /** Concatenate all lines together, separated by newlines */
    protected static String concatLines(String... lines) {
    	StringBuilder str = new StringBuilder();
    	for(int i=0; i < lines.length; i++) {
    		str.append(lines[i] + (i < lines.length-1  ?  "\n" : ""));
    	}
    	return str.toString();
    }
    
    /** Ex: "/testData/genes.bed" */
    private File fromPath(String relativePath) {
    	return new File( getClass().getResource(relativePath).getPath() );
    }
}