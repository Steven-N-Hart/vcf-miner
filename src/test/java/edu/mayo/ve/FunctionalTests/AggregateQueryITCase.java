package edu.mayo.ve.FunctionalTests;

import static org.junit.Assert.fail;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import edu.mayo.ve.message.InfoFlagFilter;
import edu.mayo.ve.message.InfoNumberFilter;
import edu.mayo.ve.message.InfoStringFilter;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SampleGroup;
import edu.mayo.ve.resources.ExeQuery;

/** Test the Aggregation Pipeline on sample groups */
public class AggregateQueryITCase {

	protected enum Zygosity { homozygous, heterozygous, either };
	protected enum VariantSelect { Normal, Inverse };
	
	protected Querry mQuery = null;
	private int minMatch = 0;

	protected static String sWorkspaceKey1 = null;
	protected static String sWorkspaceKey2 = null;
	
	// TODO: Test "downloadFile" as well to test results file.  Verify that we can get > 1000 rows back (to test that it does NOT truncate like the UI does)
	//		- test both the original query + aggregation
	
	// TODO: Test both sampleGroups == 0 and sampleGroups > 0 (this will direct the code down either the normal or the aggregate paths)
	//	Call:			return new ExeQuery().handleBasicQuery(query);   -- NEW
	// Or call:			return new ExeQuery().handleBasicQuerry2(query); -- OLD - will be removed later
	
	
	protected static String[] VCF1 = {
		"##FORMAT=<ID=GT,Number=1,Type=String,Description=\"Genotype\">",
		concat("#CHROM",	"POS",	"ID",	"REF",	"ALT",	"QUAL",	"FILTER",	"INFO",		"FORMAT",	"A",	"B",	"C",	"D",	"E",	"F",	"G"),
		concat("1",			"100",	"rs01",	"A",	"C",	".",	".",		".",		"GT",		"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("2",			"100",	"rs02",	"A",	"C",	".",	".",		".",		"GT",		"1|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("3",			"100",	"rs03",	"A",	"C",	".",	".",		".",		"GT",		"1|0",	"1|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("4",			"100",	"rs04",	"A",	"C",	".",	".",		".",		"GT",		"0|1",	"0|1",	"0|1",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("5",			"100",	"rs05",	"A",	"C",	".",	".",		".",		"GT",		"0|1",	"0|1",	"0|1",	"0|1",	"0|0",	"0|0",	"0|0"),
		concat("6",			"100",	"rs06",	"A",	"C",	".",	".",		".",		"GT",		"0|1",	"0|1",	"0|1",	"0|1",	"0|1",	"0|0",	"0|0"),
		concat("7",			"100",	"rs07",	"A",	"C",	".",	".",		".",		"GT",		"1|1",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("8",			"100",	"rs08",	"A",	"C",	".",	".",		".",		"GT",		"1|1",	"1|1",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("9",			"100",	"rs09",	"A",	"C",	".",	".",		".",		"GT",		"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"1|1",	"0|0"),
		concat("10",		"100",	"rs10",	"A",	"C",	".",	".",		".",		"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"1|1"),
		concat("11",		"100",	"rs11",	"A",	"C",	".",	".",		".",		"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0"),
	};
	
	
	protected static String[] VCF2 = {
		"##INFO=<ID=IsInDbSnp,Type=Flag,Number=0,Description=\"Is the variant in dbSNP\">",
		"##INFO=<ID=AlleleCount,Type=Integer,Number=3,Description=\"Number of alleles counted\">",
		"##INFO=<ID=AlleleFreq,Type=Float,Number=1,Description=\"Allele frequency in fraction of total alleles\">",
		"##INFO=<ID=RefAllele,Type=Character,Number=1,Description=\"Single character REF alleles only\">",
		"##INFO=<ID=Alts,Type=String,Number=.,Description=\"List of alt alleles\">",
		"##FORMAT=<ID=GT,Number=1,Type=String,Description=\"Genotype\">",
		concat("12",		"100",	"rs12",	"A",	"C",	".",	".",		"IsInDbSnp","GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0"),
		concat("13",		"100",	"rs13",	"A",	"C",	".",	".",		"AlleleCount=100,101,102",
																							"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0"),
		concat("14",		"100",	"rs14",	"A",	"C",	".",	".",		"AlleleFreq=0.05",
																							"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0"),
		concat("15",		"100",	"rs15",	"A",	"C",	".",	".",		"RefAllele=A",
																							"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0"),
		concat("16",		"100",	"rs16",	"A",	"C",	".",	".",		"Alts=A,G,T,C",
																							"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0"),
		concat("15",		"100",	"rs15",	"A",	"C",	".",	".",		"IsInDbSnp;AlleleCount=100,200,300,AlleleFreq=0.23,RefAllele=A,Alts=A,ACCCC,GTTTCACG",
																							"GT",		"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0")
	};
	
	
	@BeforeClass
	// Create a temporary VCF file and import it into Mongo
	public static void importVcf() throws Exception {
		// Store the vcf text to a temporary file
		TemporaryFolder tempFolder = new TemporaryFolder();
		tempFolder.create();
		
		File vcfFile1 = tempFolder.newFile();
		FileUtils.writeLines(vcfFile1, Arrays.asList(VCF1));

		File vcfFile2 = tempFolder.newFile();
		FileUtils.writeLines(vcfFile2, Arrays.asList(VCF1));

		// Setup securityUserApp mock-up
		VCFUploadResourceITCase.setupLoaderPool();
		VCFUploadResourceITCase uploader = new VCFUploadResourceITCase();
		uploader.setupMocks();
		
		// Upload the VCF file to the Mongo database
		sWorkspaceKey1 = uploader.uploadFile(vcfFile1);
		//sWorkspaceKey2 = uploader.uploadFile(vcfFile2);
	}
	
	@AfterClass
	public static void tearDownWorkerPool() throws InterruptedException {
		VCFUploadResourceITCase.tearDownLoaderPool();
	}
	
	@Before
	public void buildQuerry() {
		mQuery = new Querry();
		mQuery.setNumberResults(1000);
		mQuery.setWorkspace(sWorkspaceKey1);
	}
	
	// Example call:
	// testAggregate(   Zygosity,				SampleNames, 	minToMatch,		Samples - Any vs None,	rsIdsExpected )	
	@Test	// Match at least 1 of 5 sample groups - Heterozygous  (1 sample matches, 1 row)
	public void testSamplesInGroup1() throws Exception
	{	testAggregate(Zygosity.heterozygous, 	"E",			(minMatch=1),	VariantSelect.Normal,	"rs06");  }

	@Test	// Match at least 1 of 5 sample groups - Heterozygous  (1 sample matches, 5 rows)
	public void testSamplesInGroup1b() throws Exception
	{	testAggregate(Zygosity.heterozygous, 	"A",			(minMatch=1),	VariantSelect.Normal,	"rs02,rs03,rs04,rs05,rs06");  }

	@Test	// Match at least 1 of 5 sample groups - Homozygous	   (2 samples match,  2 rows)
	public void testSamplesInGroup2() throws Exception
	{ 	testAggregate(Zygosity.homozygous, 		"D,E",			(minMatch=1),	VariantSelect.Normal,	"rs10,rs11"); }
		
	@Test	// Match at least 1 of 5 sample groups - Either Hetero or Homo  (5 samples match, 10 rows)
	public void testSamplesInGroup3() throws Exception
	{	testAggregate(Zygosity.either, 			"A,B,C,D,E",	(minMatch=1),	VariantSelect.Normal,	"rs02,rs03,rs04,rs05,rs06,rs07,rs08,rs09,rs10,rs11"); }
		
	@Test	// Match at least 1 of 5 sample groups - Either Hetero or Homo  (5 samples match, 10 rows, but only return first 3 in batch)
	// 		   NOTE: There is no guarantee that the first 3 results will be returned - it could be any.
	public void testSamplesInGroup4() throws Exception
	{	mQuery.setNumberResults(3);
		testAggregate(Zygosity.either, 			"A,B,C,D,E",	(minMatch=1),	VariantSelect.Normal,	"rs02,rs03,rs04,rs05,rs06,rs07,rs08,rs09,rs10,rs11"); }

	@Test	// Match at least 3 of 5 sample groups - Homozygous    (3 samples match, 1 row)
			// This tests the inversion approach where it tries to find 2 that don't match
	public void testSamplesInGroup5() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"C,D,E,F",		(minMatch=3),	VariantSelect.Normal,	"rs11"); }

	@Test	// Match at least 3 of 4 sample groups - Homozygous	   (but cannot find any results)
	public void testSamplesInGroup6() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"D,E,F",		(minMatch=3),	VariantSelect.Normal,	""); }

	@Test 	// Match at least 5 of 5 sample groups - Homozygous    (1 row)
	public void testSamplesInGroup7() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"A,B,C,D,E",	(minMatch=5),	VariantSelect.Normal,	"rs11"); }

	@Test	// Match at least 5 of 5 sample groups - Homozygous    (but cannot find any results)
	public void testSamplesInGroup8() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"C,D,E,F,G",	(minMatch=5),	VariantSelect.Normal,	""); }

	@Test	// FAIL: Match at least 6 of 5 - should fail immediately since the requested number of samples is > actual # of samples 
	public void testSamplesInGroup9() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"A,B,C,D,E",	(minMatch=6),	VariantSelect.Normal,	""); }
	
	@Test	// FAIL: sample not in VCF
	public void testSamplesInGroup10() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"Z",			(minMatch=1),	VariantSelect.Normal,	""); }
	
	//------------------------------------------------------------------------------------------------------------------------
	// Test samples not in group
	//------------------------------------------------------------------------------------------------------------------------
	
	@Test	// Sample not in VCF - should return ALL variants
	public void testSamplesNotInGroup1() throws Exception
	{	testAggregate(Zygosity.either, 			"Z",			(minMatch=1),	VariantSelect.Inverse,	"rs01,rs02,rs03,rs04,rs05,rs06,rs07,rs08,rs09,rs10,rs11"); }

	@Test	// Match at least one, but not in the group we specify  (rs09,rs10,rs11 are normal match, so all others are reverse)
	public void testSamplesNotInGroup2() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"A,B,C,D,E",	(minMatch=3),	VariantSelect.Inverse,	"rs01,rs02,rs03,rs04,rs05,rs06,rs07,rs08"); }
		
	@Test	// Match at least 5, but not in the group we specify (try to use reverse selection logic) - NONE match criteria, so inverse should return ALL variants
	public void testSamplesNotInGroup3() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"C,D,E,F,G",	(minMatch=5),	VariantSelect.Inverse,	"rs01,rs02,rs03,rs04,rs05,rs06,rs07,rs08,rs09,rs10,rs11"); }

	@Test	// Match at least 5, but not in the group we specify (try to use reverse selection logic) - ONE matches (rs11), so inverse should return all variants except that one
	public void testSamplesNotInGroup4() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"A,B,C,D,E",	(minMatch=5),	VariantSelect.Inverse,	"rs01,rs02,rs03,rs04,rs05,rs06,rs07,rs08,rs09,rs10"); }

	@Test	// Match at least 1, but not in the group we specify (try to use reverse selection logic) - All but one match, so inverse should return just the one that did not match
	public void testSamplesNotInGroup5() throws Exception
	{	testAggregate(Zygosity.either, 			"A",			(minMatch=1),	VariantSelect.Inverse,	"rs01"); }

	@Test	// Match at least 1 hetero, but not in the group we specify (try to use reverse selection logic) - Normal = 3,4,5,6; so reverse should be 1,2,7,8,9,10,11
	public void testSamplesNotInGroup6() throws Exception
	{	testAggregate(Zygosity.heterozygous,	"B",			(minMatch=1),	VariantSelect.Inverse,	"rs01,rs02,rs07,rs08,rs09,rs10,rs11"); }

	//------------------------------------------------------------------------------------------------------------------------
	// Test both INFO and sample-in-group fields
	//------------------------------------------------------------------------------------------------------------------------
	
	// Test: try a field even tho INFO only has "."  (MISS)
	
	// Test: try a flag when the flag is not set on the line  (MISS)
	
	// Test: try one of 3 values in same field  - Ex: AlleleCount = 100  (MATCH)
	
	// Test: try 1 row match via INFO, but none via sample group  (MISS)
	
	// Test: try 1 row match via sample group, but none via INFO field  (MISS)
	
	// Test: try matching 3 INFO fields (+ one sample group)  (MATCH)  
	
	// Test: try matching 3 INFO fields (+ one sample group), but only 1 INFO field matches query  (MISS)
	
	// Test: Apply 2 different filters to same INFO field (along with one sample group) - Ex: AlleleFreq > 0.1 and AlleleFreq <= 0.2  (MATCH)

	// Test: Apply 2 different filters to same INFO field (along with one sample group) - Ex: AlleleFreq > 0.1 and AlleleFreq <= 0.2  (MISS)
	
	// Test: Apply 2 filters - 1 to each of two different INFO fields (+ one sample group) - Ex: AlleleFreq > 0.3 and RefAllele = C   (MATCH)
	
	@Test
	/** Test "Samples in group" and match on INFO field - one flag and one sample */
	public void testSampleGroupsAndInfoFields1() {
		//addInfoFields( )
		// TODO: Add all other tests here..........................
		
		/** Match - on 2 INFO fields and at least 2 of 5 sample groups */
		fail("Not implemented yet");
	}
	
	@Test
	/** Miss - need to match 2 of 5 INFO and 2 of 5 samples, but only 1 of each matched */
	public void miss_2info_sample_butNoneMatch() {
		
	}
	
	@Test
	/** Miss - need to match 2 of 5 INFO and 2 of 5 samples; 2 INFO match, but only 1 sample */
	public void miss_2infoMatch_1sampleMatchButNeed2of5() {
		
	}
	
	@Test
	/** Miss - need to match 2 of 5 INFO and 2 of 5 samples; only 1 of 5 INFO match, but 2 samples match */
	public void miss_1infoMatchButNeed2_2sampleMatch() {
		
	}

	//------------------------------------------------------------------------------------------------------------------------

	@Test
	/** INFO search only - no sample groups (should use old logic) */
	public void infoOnly1() {
		
	}
	
	
	//===========================================================================================================================================
	
	protected void testAggregate(Zygosity zygosity, String sampleNamesStr, int atLeastMatch, VariantSelect selection, String rsIdsExpectedStr) throws Exception
	{
		addSampleGroups(mQuery, Arrays.asList(sampleNamesStr.split(",")), zygosity, selection.equals(VariantSelect.Normal), atLeastMatch);
		String resultsJson = execQuery(mQuery);
		
		List<String> rsIdsResults = getRsIdsFromResults(resultsJson);
		
		List<String> rsIdsExpected = (rsIdsExpectedStr == null || rsIdsExpectedStr.length() == 0)  
										?  new ArrayList<String>()
										:  Arrays.asList(rsIdsExpectedStr.split(","));
		
		Collections.sort(rsIdsResults);
		Collections.sort(rsIdsExpected);
		
		boolean isOutputTruncated = (mQuery.getNumberResults() < rsIdsExpected.size());
		int expectedResultCount = isOutputTruncated  ?  mQuery.getNumberResults()  :  rsIdsExpected.size();
		String errorMsg = "Expected rsIds do not match actual:\nExpected: " + rsIdsExpected + "\nActual:     " + rsIdsResults + "\n";
		Assert.assertEquals(errorMsg + "Sizes different: ", expectedResultCount,  rsIdsResults.size());
		
		// If the output was truncated, then verify that truncated actual results are a subset of the full expected results
		if( isOutputTruncated ) {
			Assert.assertTrue(rsIdsExpected.containsAll(rsIdsResults));
		} else { // If NOT truncated, then compare ALL of the results
			for(int i=0; i < rsIdsExpected.size(); i++) {
				Assert.assertEquals(errorMsg + "\nArray element[" + i + "]: ", rsIdsExpected.get(i), rsIdsResults.get(i));
			}
		}
			
	}

	private List<String> getRsIdsFromResults(String resultsJson) {
		// Convert the results to JSON object
		JsonParser jsonParser = new JsonParser();
		JsonObject jsonObj = (JsonObject)(jsonParser.parse(resultsJson));
		
		// Get list of rsIds from actual results
		List<String> rsIdsResults = new ArrayList<String>();
		JsonArray jsonArray = jsonObj.getAsJsonArray("results");
		for(int i=0; i < jsonArray.size(); i++) {
			String rsId = jsonArray.get(i).getAsJsonObject().getAsJsonPrimitive("ID").getAsString();
			rsIdsResults.add(rsId);
		}
		return rsIdsResults;
	}
	
	

	
	/** Build the Querry object for sample-group tests
	 * @param sampleNames  List of sample names to match on
	 * @param zygosity  "heterzygous", "homozygous", "either"
	 * @param isMatchSamplesInGroup  If true, then match the samples defined in the group, else if false then samples should NOT match
	 * 			Example: If you choose A,B,C out of A,B,C,D,E and chose isMatchSamplesInGroup="false" and min=1 and zygosity=heterozygous,
	 * 					 then at least 1 of the samples you did NOT choose (D,E) must be heterozygous 
	 * @param minSamplesToMatch  The minimum number of samples that must match before the variant is returned
	 * @return
	 */
	protected Querry addSampleGroups(Querry query, List<String> sampleNames, Zygosity zygosity, boolean isMatchSamplesInGroup, int minSamplesToMatch) {
		// Build the sample group
		SampleGroup sampleGroup = new SampleGroup();
		sampleGroup.setSamples(sampleNames);
		sampleGroup.setInSample(isMatchSamplesInGroup);
		sampleGroup.setZygosity(zygosity.toString());
		sampleGroup.setMinMatchingSamplesInVariant(minSamplesToMatch);
		
		query.setSampleGroups(Arrays.asList(sampleGroup));
		return query;
	}
	
	/** Add INFO-fields to an already built Querry object	 */
	protected void addInfoFields(ArrayList<InfoFlagFilter> flagFilters,  ArrayList<InfoNumberFilter> numFilters, ArrayList<InfoStringFilter> strFilters) {
		mQuery.setInfoFlagFilters(flagFilters);
		mQuery.setInfoNumberFilters(numFilters);
		mQuery.setInfoStringFilters(strFilters);
	}
	
	protected String execQuery(Querry query) throws Exception {
		return new ExeQuery().handleBasicQuerry2(query);
	}

	protected static String concat(String... col) {
		StringBuilder str = new StringBuilder();
		for(int i=0; i < col.length; i++) {
			if( i > 0 )
				str.append("\t");
			str.append(col[i]);
		}
		return str.toString();
	}
	
	/** Verify that the resultLines match the expectedLines */
	protected void verifyResults(List<String> expectedLines, List<String> resultLines) {
		Assert.assertEquals("Size of expected results did not match actual results", expectedLines.size(), resultLines.size());
		for(int i=0; i < expectedLines.size(); i++) {
			Assert.assertEquals(expectedLines.get(i), resultLines.get(i));
		}
	}
	
	/** Run the query, providing INFO field keys and values ("AF=0.13","MAF=0.22") and sample names ("A","B") */
	protected List<String> query(List<String> infoKeyAndVal, List<String> sampleNames) {
		List<String> results = new ArrayList<String>();
		
		
		return results;
	}
	
	
}
