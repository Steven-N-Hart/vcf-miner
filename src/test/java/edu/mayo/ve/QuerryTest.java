package edu.mayo.ve;

import com.mongodb.DBObject;
import edu.mayo.ve.message.*;
import edu.mayo.ve.resources.Samples;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 6/25/13
 * Time: 9:32 AM
 * To change this template use File | Settings | File Templates.
 */
public class QuerryTest {


    @Test
    public void testWhatFilters() throws Exception {
        Querry q = new Querry();
        ArrayList<String> f = q.whatFilters();
        assertEquals(0, f.size());
        //test to see if adding number filters works
        //q.setMaxAC(10.0);
        SampleNumberFilter maxAC = new SampleNumberFilter("max","AC",10.0,"$lt");
        //q.setMinAC(2.0);
        SampleNumberFilter minAC = new SampleNumberFilter("min","AC",2.0,"$gt");
        //q.setMinPHRED(10.0);
        SampleNumberFilter minPHRED = new SampleNumberFilter("min","PL",10.0,"$gt");
        ArrayList<SampleNumberFilter> sampleFilters = new ArrayList<SampleNumberFilter>(Arrays.asList(maxAC,minAC,minPHRED));
        q.setSampleNumberFilters(sampleFilters);
        f = q.whatFilters();
        assertEquals(1, f.size());
    }

    public Querry addSampleNumberFilter(Querry q, String minmax, String field, Double value, String operator){
        SampleNumberFilter snf = new SampleNumberFilter(minmax,field,value,operator);
        ArrayList<SampleNumberFilter> sampleFilters = q.getSampleNumberFilters();
        if(sampleFilters==null || sampleFilters.size()==0){
            sampleFilters = new ArrayList<SampleNumberFilter>(Arrays.asList(snf));
            q.setSampleNumberFilters(sampleFilters);
        }else {
            sampleFilters.add(snf);
            q.setSampleNumberFilters(sampleFilters);
        }
        return q;
    }

    /**
     * test all 6 basic flags in isolation
     * @throws Exception
     */
    @Test
    public void testCreateQuery() throws Exception {
        Querry q = null;
        //PL
        //q.setMinPHRED(50.0);
        q = addSampleNumberFilter(new Querry(), "min", "PL", 50.0, "$gte");
        DBObject query = q.createQuery();
        System.out.println(query.toString());
        assertEquals("{ \"FORMAT.min.PL\" : { \"$gte\" : 50.0}}", query.toString());
        //maxAC
        q = addSampleNumberFilter(new Querry(), "max", "AC", 2.0, "$lte");
        //q.setMaxAC(2.0);
        query = q.createQuery();
        System.out.println(query.toString());
        assertEquals("{ \"FORMAT.max.AC\" : { \"$lte\" : 2.0}}", query.toString());

    }

    @Test
    public void testNullQuery(){
        Querry q = new Querry();
        DBObject query = q.createQuery();
        assertEquals("{ }", query.toString());
    }

    @Test
    public void testCompoundQuery() throws Exception {
        Querry q;
        //q.setMinPHRED(50.0);
        q = addSampleNumberFilter(new Querry(), "min", "PL", 50.0, "$gte");
        //q.setMinAltReads(5.0);
        q = addSampleNumberFilter(q, "min", "AD", 5.0, "$gte");
        DBObject query = q.createQuery();
        System.out.println(query.toString());
        assertEquals("{ \"$and\" : [ { \"FORMAT.min.PL\" : { \"$gte\" : 50.0}} , { \"FORMAT.min.AD\" : { \"$gte\" : 5.0}}]}", query.toString());

    }

    //This one actually worked:
    //> db.w367c39e529255ef0eb634f9949b9982bd45666cb.find({ "$and" : [ { "samples" : { "$elemMatch" : { "sampleID" : "s_Mayo_TN_CC_371" , "GenotypePositive" : 1}}} , { "samples" : { "$elemMatch" : { "sampleID" : "s_Mayo_TN_CC_372" , "GenotypePositive" : 1}}}]}).count()
    //313
    @Test
    public void testSimpleSampleGroupQuery(){
        Querry q = new Querry();
        SampleGroup sampleGroup = new SampleGroup();
        ArrayList<String> samp = new ArrayList<String>();
        samp.add("X"); samp.add("Y");
        sampleGroup.setSamples(samp);
        ArrayList<SampleGroup> samples = new ArrayList<SampleGroup>();
        samples.add(sampleGroup);
        q.setSampleGroups(samples);
        DBObject b = q.createQuery();
        //Legacy method
        //String e = "{ \"$or\" : [ { \"samples\" : { \"$elemMatch\" : { \"sampleID\" : \"X\" , \"GenotypePositive\" : 1}}} , { \"samples\" : { \"$elemMatch\" : { \"sampleID\" : \"Y\" , \"GenotypePositive\" : 1}}}]}";
        String e = "{ \"FORMAT.GenotypePositiveList\" : { \"$in\" : [ \"X\" , \"Y\"]}}";
        assertEquals(e, b.toString());
        sampleGroup.setInSample(false);
        //String f = "{ \"$or\" : [ { \"samples\" : { \"$elemMatch\" : { \"sampleID\" : \"X\" , \"GenotypePositive\" : { \"$ne\" : 1}}}} , { \"samples\" : { \"$elemMatch\" : { \"sampleID\" : \"Y\" , \"GenotypePositive\" : { \"$ne\" : 1}}}}]}";
        String f = "{ \"FORMAT.GenotypePositiveList\" : { \"$nin\" : [ \"X\" , \"Y\"]}}";
        DBObject c = q.createQuery();
        assertEquals(f, c.toString());
    }

    @Test
    public void testInfoStringQuery(){
        Querry q = new Querry();
        ArrayList<InfoStringFilter> filters = new ArrayList<InfoStringFilter>();
        InfoStringFilter isf = new InfoStringFilter();
        ArrayList<String> values = new ArrayList<String>();
        isf.setKey("foo");
        isf.setComparator("$in");
        values.add("a");
        isf.setValues(values);
        filters.add(isf);
        q.setInfoStringFilters(filters);
        assertEquals("{ \"INFO.foo\" : { \"$in\" : [ \"a\"]}}", q.createQuery().toString());
        values.add("b");
        isf.setValues(values);
        filters.remove(0);
        filters.add(isf);
        q.setInfoStringFilters(filters);
        assertEquals("{ \"INFO.foo\" : { \"$in\" : [ \"a\" , \"b\"]}}", q.createQuery().toString());
        //assertEquals("{ \"foo\" : { \"$in\" : [ \"a\", \"b\"]}}", q.createQuery());
        //assertEquals(" { foo: { $in: [ \"a\", \"b\" ] } } ", q.createQuery());
    }

    @Test
    public void testMultiInfoStringQuery(){
        Querry q = new Querry();
        ArrayList<InfoStringFilter> filters = new ArrayList<InfoStringFilter>();
        InfoStringFilter isf = new InfoStringFilter();
        ArrayList<String> values = new ArrayList<String>();
        isf.setKey("foo");
        isf.setComparator("$in");
        values.add("a");
        isf.setValues(values);
        filters.add(isf);
        InfoStringFilter isf2 = new InfoStringFilter();
        isf2.setKey("bar");
        isf2.setComparator("$nin");
        values.add("b");
        isf2.setValues(values);
        filters.add(isf2);
        q.setInfoStringFilters(filters);
        //this query of course makes no sense, but it correctly tests the behavior of a compound query
        assertEquals("{ \"$and\" : [ { \"INFO.foo\" : { \"$in\" : [ \"a\" , \"b\"]}} , { \"INFO.bar\" : { \"$nin\" : [ \"a\" , \"b\"]}}]}", q.createQuery().toString());
    }

    @Test
    public void testInfoNumberQuery(){
        Querry q = new Querry();
        ArrayList<InfoNumberFilter> filters = new ArrayList<InfoNumberFilter>();
        InfoNumberFilter inf = new InfoNumberFilter();
        inf.setKey("foo");
        inf.setComparator("$gt");
        inf.setValue(10.0);
        filters.add(inf);
        q.setInfoNumberFilters(filters);
        assertEquals("{ \"INFO.foo\" : { \"$gt\" : 10.0}}", q.createQuery().toString());
        //equality
        inf = new InfoNumberFilter();
        filters = new ArrayList<InfoNumberFilter>();
        inf.setKey("INFO.foo");
        inf.setValue(11.0);
        filters.add(inf);
        q.setInfoNumberFilters(filters);
        assertEquals("{ \"INFO.foo\" : 11.0}", q.createQuery().toString());
        //now check to make sure that if the includeNulls flag is set to true that the behavior is correct
        filters = new ArrayList<InfoNumberFilter>();
        inf.setKey("foo");
        inf.setComparator("$gt");
        inf.setValue(10.0);
        inf.setIncludeNulls(true);
        filters.add(inf);
        q.setInfoNumberFilters(filters);
        assertEquals("{ \"$or\" : [ { \"INFO.foo\" : { \"$gt\" : 10.0}} , { \"INFO.foo\" :  null }]}", q.createQuery().toString());

    }

    @Test
    public void testMultiInfoNumberQuery(){
        Querry q = new Querry();
        ArrayList<InfoNumberFilter> filters = new ArrayList<InfoNumberFilter>();
        InfoNumberFilter inf1 = new InfoNumberFilter();
        inf1.setValue(12.0);
        inf1.setKey("foo");
        filters.add(inf1);
        InfoNumberFilter inf2 = new InfoNumberFilter();
        inf2.setValue(13.0);
        inf2.setKey("bar");
        inf2.setComparator("$gt");
        filters.add(inf2);
        q.setInfoNumberFilters(filters);
        assertEquals("{ \"$and\" : [ { \"INFO.foo\" : 12.0} , { \"INFO.bar\" : { \"$gt\" : 13.0}}]}", q.createQuery().toString());
        //now check to see if including nulls works...
        filters = new ArrayList<InfoNumberFilter>();
        inf1.setIncludeNulls(true);
        filters.add(inf1);
        filters.add(inf2);
        q = new Querry();
        q.setInfoNumberFilters(filters);
        assertEquals("{ \"$and\" : [ { \"$or\" : [ { \"INFO.foo\" : 12.0} , { \"INFO.foo\" :  null }]} , { \"INFO.bar\" : { \"$gt\" : 13.0}}]}", q.createQuery().toString());

    }


    @Test
    public void testInfoFlagQuery(){
        Querry q = new Querry();
        ArrayList<InfoFlagFilter> filters = new ArrayList<InfoFlagFilter>();
        InfoFlagFilter iff = new InfoFlagFilter();
        iff.setKey("foo");
        iff.setValue(true);
        filters.add(iff);
        q.setInfoFlagFilters(filters);
        assertEquals("{ \"INFO.foo\" : true}", q.createQuery().toString());
        //equality
        InfoFlagFilter iff2 = new InfoFlagFilter();
        filters = new ArrayList<InfoFlagFilter>();
        iff2.setKey("INFO.bar");
        iff2.setValue(false);
        filters.add(iff);
        filters.add(iff2);
        q.setInfoFlagFilters(filters);
        //true is for the flag if it is there, false is null because it will not be in the table!
        assertEquals("{ \"$and\" : [ { \"INFO.foo\" : true} , { \"INFO.bar\" :  null }]}", q.createQuery().toString());

    }

    /**
     * this test is similar to the sample group query, but it is based on the homo/hetro arrays instead of genotype positivie array
     */
    @Test
    public void testZygosity(){
        Querry q = new Querry();
        SampleGroup sampleGroup = new SampleGroup();
        ArrayList<String> samp = new ArrayList<String>();
        samp.add("X"); samp.add("Y");
        sampleGroup.setSamples(samp);
        sampleGroup.setZygosity("heterozygous");
        ArrayList<SampleGroup> samples = new ArrayList<SampleGroup>();
        samples.add(sampleGroup);
        q.setSampleGroups(samples);
        DBObject b = q.createQuery();
        String e = "{ \"FORMAT.HeterozygousList\" : { \"$in\" : [ \"X\" , \"Y\"]}}";
        assertEquals(e, b.toString());
        sampleGroup.setInSample(false);
        //String f = "{ \"$or\" : [ { \"samples\" : { \"$elemMatch\" : { \"sampleID\" : \"X\" , \"GenotypePositive\" : { \"$ne\" : 1}}}} , { \"samples\" : { \"$elemMatch\" : { \"sampleID\" : \"Y\" , \"GenotypePositive\" : { \"$ne\" : 1}}}}]}";
        String f = "{ \"FORMAT.HeterozygousList\" : { \"$nin\" : [ \"X\" , \"Y\"]}}";
        DBObject c = q.createQuery();
        assertEquals(f, c.toString());
        samples.remove(0);
        sampleGroup.setInSample(true);
        sampleGroup.setZygosity("homozygous");
        samples.add(sampleGroup);
        e = "{ \"FORMAT.HomozygousList\" : { \"$in\" : [ \"X\" , \"Y\"]}}";
        b = q.createQuery();
        assertEquals(e, b.toString());
        f = "{ \"FORMAT.HomozygousList\" : { \"$nin\" : [ \"X\" , \"Y\"]}}";
        sampleGroup.setInSample(false);
        c = q.createQuery();
        assertEquals(f, c.toString());


    }
}
