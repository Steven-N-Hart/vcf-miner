package edu.mayo.ve.util;

import static org.junit.Assert.assertEquals;

import java.io.File;
import java.io.IOException;

import org.junit.Test;

public class IOUtilsTest {

	@Test
	public void testNonEmptyLineCount() throws IOException {
		assertEquals( 39867, IOUtils.countNonEmptyLines(fromPath("/testData/genes.bed")) );
		assertEquals( 3,     IOUtils.countNonEmptyLines(fromPath("/testData/genes3.bed")) );
		assertEquals( 0, 	 IOUtils.countNonEmptyLines(fromPath("/testData/genes0.bed")) );
	}
	
	@Test
	public void testLineCount_VCFParser() throws IOException {
		assertEquals( 39868, IOUtils.getLineCount(fromPath("/testData/genes.bed")) );
		assertEquals( 3,     IOUtils.getLineCount(fromPath("/testData/genes3.bed")) );
		assertEquals( 1, 	 IOUtils.getLineCount(fromPath("/testData/genes0.bed")) );
	}
    
    /** Ex: "/testData/genes.bed" */
    private File fromPath(String relativePath) {
    	return new File( getClass().getResource(relativePath).getPath() );
    }

}
