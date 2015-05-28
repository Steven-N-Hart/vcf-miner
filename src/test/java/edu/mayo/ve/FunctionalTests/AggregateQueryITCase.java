package edu.mayo.ve.FunctionalTests;

import static org.junit.Assert.fail;

import java.io.File;
import java.io.IOException;
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
		concat("#CHROM","POS",	"ID",	"REF",	"ALT",	"QUAL",	"FILTER",	"INFO",	"FORMAT", "A",	"B",	"C",	"D",	"E",	"F",	"G"),
		concat("1",		"100",	"rs01",	"A",	"C",	".",	".",		".",	"GT",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("2",		"100",	"rs02",	"A",	"C",	".",	".",		".",	"GT",	"1|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("3",		"100",	"rs03",	"A",	"C",	".",	".",		".",	"GT",	"1|0",	"1|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("4",		"100",	"rs04",	"A",	"C",	".",	".",		".",	"GT",	"0|1",	"0|1",	"0|1",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("5",		"100",	"rs05",	"A",	"C",	".",	".",		".",	"GT",	"0|1",	"0|1",	"0|1",	"0|1",	"0|0",	"0|0",	"0|0"),
		concat("6",		"100",	"rs06",	"A",	"C",	".",	".",		".",	"GT",	"0|1",	"0|1",	"0|1",	"0|1",	"0|1",	"0|0",	"0|0"),
		concat("7",		"100",	"rs07",	"A",	"C",	".",	".",		".",	"GT",	"1|1",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("8",		"100",	"rs08",	"A",	"C",	".",	".",		".",	"GT",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("9",		"100",	"rs09",	"A",	"C",	".",	".",		".",	"GT",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"1|1",	"0|0"),
		concat("10",	"100",	"rs10",	"A",	"C",	".",	".",		".",	"GT",	"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"1|1"),
		concat("11",	"100",	"rs11",	"A",	"C",	".",	".",		".",	"GT",	"1|1",	"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0"),
	};
	
	
	protected static String[] VCF2 = {
		"##INFO=<ID=IsInDbSnp,Type=Flag,Number=0,Description=\"Is the variant in dbSNP\">",
		"##INFO=<ID=AlleleCount,Type=Integer,Number=3,Description=\"Number of alleles counted\">",
		"##INFO=<ID=AlleleFreq,Type=Float,Number=1,Description=\"Allele frequency in fraction of total alleles\">",
		"##INFO=<ID=RefAllele,Type=Character,Number=1,Description=\"Single character REF alleles only\">",
		"##INFO=<ID=Alts,Type=String,Number=.,Description=\"List of alt alleles\">",
		"##INFO=<ID=SomeInt,Type=Number,Number=1,Description=\"Some integer\">",
		"##FORMAT=<ID=GT,Number=1,Type=String,Description=\"Genotype\">",
		concat("#CHROM","POS",	"ID",	"REF",	"ALT",	"QUAL",	"FILTER",	"INFO",	"FORMAT", "A",	"B",	"C",	"D",	"E",	"F",	"G"),
		concat("12",	"100",	"rs12",	"A",	"C",	".",	".",		"IsInDbSnp",
																					"GT",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0",	"1|0"),
		concat("13",	"100",	"rs13",	"A",	"C",	".",	".",		"AlleleCount=100,101,102",
																					"GT",	"0|1",	"0|1",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("14",	"100",	"rs14",	"A",	"C",	".",	".",		"AlleleFreq=0.05",
																					"GT",	"1|0",	"1|0",	"0|0",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("15",	"100",	"rs15",	"A",	"C",	".",	".",		"RefAllele=A",
																					"GT",	"0|1",	"1|0",	"1|1",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("16",	"100",	"rs16",	"A",	"C",	".",	".",		"Alts=A,G,T,C;SomeInt=3942",
																					"GT",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0",	"0|0"),
		concat("17",	"100",	"rs17",	"A",	"C",	".",	".",		"IsInDbSnp;AlleleCount=100,200,300;AlleleFreq=0.23;RefAllele=A;Alts=A,ACCCC,GTTTCACG",
																					"GT",	"1|1",	"1|1",	"1|1",	"1|1",	"0|0",	"0|0",	"0|0"),
		concat("18",	"100",	"rs18",	"A",	"C",	".",	".",		".",	"GT",	"1|1",	"1|1",	"1|1",	"1|1",	"1|0",	"0|0",	"0|0")
	};
	
	
	@BeforeClass
	// Create a temporary VCF file and import it into Mongo
	public static void uploadVcfs() throws Exception {
		sWorkspaceKey1 = uploadVcf(VCF1);
		sWorkspaceKey2 = uploadVcf(VCF2);
	}
	
	public static String uploadVcf(String[] vcfLines) throws Exception {
		// Store the vcf text to a temporary file
		TemporaryFolder tempFolder = new TemporaryFolder();
		tempFolder.create();
		
		File vcfFile = tempFolder.newFile();
		FileUtils.writeLines(vcfFile, Arrays.asList(vcfLines));

		// Setup securityUserApp mock-up
		VCFUploadResourceITCase.setupLoaderPool();
		VCFUploadResourceITCase uploader = new VCFUploadResourceITCase();
		uploader.setupMocks();
		
		// Upload the VCF file to the Mongo database
		String workspaceKey = uploader.uploadFile(vcfFile);
		return workspaceKey;
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

	@Test	// MISS: Match at least 6 of 5 - should fail immediately since the requested number of samples is > actual # of samples 
	public void testSamplesInGroup9() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"A,B,C,D,E",	(minMatch=6),	VariantSelect.Normal,	""); }
	
	@Test	// MISS: sample not in VCF
	public void testSamplesInGroup10() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"Z",			(minMatch=1),	VariantSelect.Normal,	""); }
	
	@Test	// Match at least 1 of 5 sample groups, where the sample name is not same case
	public void testSamplesInGroup11() throws Exception
	{	testAggregate(Zygosity.homozygous, 		"e",			(minMatch=1),	VariantSelect.Normal,	"rs11"); }
	
	
	
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
	
	@Test	/** Test "Samples in group" and match on INFO field - one flag (TRUE) and one sample */
	public void testSampleGroupsAndInfoFields1() throws Exception {
		addInfoFields( new InfoFlagFilter("IsInDbSnp", true) );
		testAggregate(Zygosity.heterozygous,	"G",			(minMatch=1),	VariantSelect.Normal,	"rs12");
	}
	
	@Test	/** Test "Samples in group" and match on INFO field - one flag and one sample, where flag is FALSE */
	public void testSampleGroupsAndInfoFields2() throws Exception {
		addInfoFields( new InfoFlagFilter("IsInDbSnp", false) );
		testAggregate(Zygosity.homozygous,		"D",			(minMatch=1),	VariantSelect.Normal,	"rs16");
	}
	
	@Test	/** 1 INFO field that does NOT match because INFO is ".", 1 sample-group that DOES match - MISS */
	public void testSampleGroupsAndInfoFields3() throws Exception {
		addInfoFields( new InfoFlagFilter("IsInDbSnp", true));
		testAggregate(Zygosity.heterozygous,	"E",			(minMatch=1),	VariantSelect.Normal,	"");
	}

	@Test 	/** 1 row match via INFO, but none via sample group - (MISS) */
	public void testSampleGroupsAndInfoFields4() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("A"), "=", false));
		testAggregate(Zygosity.heterozygous,	"E",			(minMatch=1),	VariantSelect.Normal,	"");
	}
	
	@Test 	/** No match in INFO, but 1 row match via sample group -  (MISS) */
	public void testSampleGroupsAndInfoFields5() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("C"), "=", false));
		testAggregate(Zygosity.homozygous,		"C",			(minMatch=1),	VariantSelect.Normal,	"");
	}

	@Test	/** Match 3 INFO fields (+ one sample group)  - (MATCH) */  
	public void testSampleGroupsAndInfoFields6() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("A"), "=", false),
					   new InfoNumberFilter("AlleleFreq", 0.23, ">=", false),
					   new InfoFlagFilter("IsInDbSnp", true)  );
		testAggregate(Zygosity.homozygous,		"C",			(minMatch=1),	VariantSelect.Normal,	"rs15");
	}

	@Test 	/** Try matching 2 INFO fields (+ one sample group), but only 1 INFO field matches query - (MISS) */
	public void testSampleGroupsAndInfoFields7() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("A"), "=", false),
				   	   new InfoNumberFilter("AlleleFreq", 0.23, "<", false)  );
		testAggregate(Zygosity.homozygous,		"C",			(minMatch=1),	VariantSelect.Normal,	"");
	}

	@Test 	/** Apply 2 different filters to same INFO field (along with one sample group) - Ex: AlleleFreq > 0.1 and AlleleFreq <= 0.2  (MATCH) */
	public void testSampleGroupsAndInfoFields8() throws Exception {
		addInfoFields( new InfoNumberFilter("AlleleFreq", 0.2, ">", false),
					   new InfoNumberFilter("AlleleFreq", 0.25, "<", false) );
		testAggregate(Zygosity.homozygous,		"C",			(minMatch=1),	VariantSelect.Normal,	"rs15");
	}

	@Test	/** Apply 2 different filters to same INFO field (along with one sample group) - Ex: AlleleFreq > 0.1 and AlleleFreq <= 0.2  (MISS) */
	public void testSampleGroupsAndInfoFields9() throws Exception {
		addInfoFields( new InfoNumberFilter("AlleleFreq", 0.2, "<", false),
					   new InfoNumberFilter("AlleleFreq", 0.25, ">", false) );
		testAggregate(Zygosity.homozygous,		"C",			(minMatch=1),	VariantSelect.Normal,	"");
	}

	@Test 	/** Apply an INFO filter and an inverse sample-group filter - should AND normal INFO with reverse sample-group logic - (MATCH) */
	public void testSampleGroupsAndInfoFields10() throws Exception {
		addInfoFields( new InfoNumberFilter("AlleleCount", 102.0, "=", false) );
		testAggregate(Zygosity.either,			"C",			(minMatch=1),	VariantSelect.Inverse,	"rs13");
	}
	
	@Test	/** Test: 2 INFO filters match, but sample-group does not - MISS */
	public void testSampleGroupsAndInfoFields11() throws Exception {
		addInfoFields( new InfoNumberFilter("AlleleCount", 200.0, "=", false),
					   new InfoStringFilter("Alts", toList("A","ACCCC"), "=", false));
		testAggregate(Zygosity.heterozygous,	"C",			(minMatch=1),	VariantSelect.Normal,	"");
	}


	
	
	//------------------------------------------------------------------------------------------------------------------------
	// INFO-only  (use the old code to test this first, before we update it to a shared method)
	//------------------------------------------------------------------------------------------------------------------------

	@Test	/** Test flag of different case (IsInDbSnp vs isInDbSNP) - MISS */
	public void testInfo1() throws Exception {
		addInfoFields( new InfoFlagFilter("isInDbSNP", true) );
		verifyQueryResults(mQuery, "");
		fail("Should we match even if case not correct????");
	}
	
	@Test	/** Test String value where the value is a different case - MISS */
	public void testInfo2() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("a"), "=", false) );
		verifyQueryResults(mQuery, "");
		fail("Should we match even if case not correct????");
	}

	@Test	/** Test Number where 102 should equal 102.0 - MATCH */
	public void testInfo3() throws Exception {
		addInfoFields( new InfoNumberFilter("SomeInt", 3942.0, "=", false) );
		verifyQueryResults(mQuery, "rs16");
	}

	@Test	/** INFO string field match on 1 of 3 values - MATCH 2 */
	public void testInfo4() throws Exception {
		addInfoFields( new InfoStringFilter("Alts", toList("A"), "=", false) );
		verifyQueryResults(mQuery, "rs16,rs17");
	}

	@Test	/** INFO string field match on 2 of 3 values in one filter - MATCH 1 */
	public void testInfo5() throws Exception {
		addInfoFields( new InfoStringFilter("Alts", toList("A","G"), "=", false) );
		verifyQueryResults(mQuery, "rs16");
	}

	@Test	/** INFO Number field match on 2 of 3 values in two filters - MATCH 1 */
	public void testInfo6() throws Exception {
		addInfoFields( new InfoNumberFilter("AlleleCount", 100.0, "=", false),
					   new InfoNumberFilter("AlleleCount", 102.0, "=", false)  );
		verifyQueryResults(mQuery, "rs13");
	}


	@Test 	/** INFO Number field match on 1 of 3 values in same field  - Ex: AlleleCount = 100 - MATCH 1 */
	public void testInfo7() throws Exception {
		addInfoFields( new InfoNumberFilter("AlleleCount", 300.0, "=", false) );
		verifyQueryResults(mQuery, "rs17");
	}

	@Test  	/** Test include nulls for string field - MATCH 5 (there will be two that don't match because they are explicitly defined.  The others should match by default. */
	public void testInfo8() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("C"), "=", true) );
		verifyQueryResults(mQuery, "rs12,rs13,rs14,rs16,rs18");
	}

	@Test  	/** Test include nulls for string field that doesn't exist - MATCH ALL */
	public void testInfo9() throws Exception {
		addInfoFields( new InfoStringFilter("BadField", toList("C"), "=", true) );
		verifyQueryResults(mQuery, "rs12,rs13,rs14,rs15,rs16,rs17,rs18");
	}

	@Test  	/** INFO String field - match all in array - MATCH 1 */
	public void testInfo10() throws Exception {
		addInfoFields( new InfoStringFilter("Alts", toList("A","G","T","C"), "=", true) );
		verifyQueryResults(mQuery, "rs16");
	}

	@Test  	/** INFO String field - match all in array, but in different order  - MATCH 1*/
	public void testInfo11() throws Exception {
		addInfoFields( new InfoStringFilter("Alts", toList("C","A","T","G"), "=", true) );
		verifyQueryResults(mQuery, "rs16");
	}

	@Test	/** 2 INFO filters on two different variants, but that match independently but not together - MISS (the filters will be AND'D and therefore not accept either/or)*/
	public void testInfo12() throws Exception {
		addInfoFields( new InfoStringFilter("RefAllele", toList("A"), "=", true),
					   new InfoNumberFilter("AlleleFreq", 0.05, "=", false)  );
		verifyQueryResults(mQuery, "");
	}
	


	//------------------------------------------------------------------------------------------------------------------------

	
	
	//===========================================================================================================================================
	// Helper methods
	//===========================================================================================================================================
	
	protected void testAggregate(Zygosity zygosity, String sampleNamesStr, int atLeastMatch, VariantSelect selection, String rsIdsExpectedStr) throws Exception
	{
		addSampleGroups(mQuery, Arrays.asList(sampleNamesStr.split(",")), zygosity, selection.equals(VariantSelect.Normal), atLeastMatch);
		verifyQueryResults(mQuery, rsIdsExpectedStr);
	}
	
	protected void verifyQueryResults(Querry query, String rsIdsExpectedStr) throws Exception {
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
	protected void addInfoFields(Object... infoFilters) {
		ArrayList<InfoFlagFilter> flagFilters  = new ArrayList<InfoFlagFilter>();
		ArrayList<InfoNumberFilter> numFilters = new ArrayList<InfoNumberFilter>();
		ArrayList<InfoStringFilter> strFilters = new ArrayList<InfoStringFilter>();
		
		for(int i = 0; i < infoFilters.length; i++) {
			Object filter = infoFilters[i];
			if( filter instanceof InfoFlagFilter )
				flagFilters.add((InfoFlagFilter)(filter));
			else if( filter instanceof InfoNumberFilter )
				numFilters.add((InfoNumberFilter)(filter));
			else if( filter instanceof InfoStringFilter )
				strFilters.add((InfoStringFilter)(filter));
		}
		
		mQuery.setInfoFlagFilters(flagFilters);
		mQuery.setInfoNumberFilters(numFilters);
		mQuery.setInfoStringFilters(strFilters);
		
		// Use the 2nd VCF file since that contains the INFO fields
		mQuery.setWorkspace(sWorkspaceKey2);
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
	
	/** Converts a list of objects to an ArrayList (NOTE: ArrayList is necessary to pass to INFO field filters, instead of List) */
	private ArrayList toList(Object... objs) {
		ArrayList list = new ArrayList();
		for(int i=0; i < objs.length; i++)
			list.add(objs[i]);
		return list;
	}
	
	
}
