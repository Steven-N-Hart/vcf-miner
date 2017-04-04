package edu.mayo.ve.resources;

import com.mongodb.BasicDBObject;
import edu.mayo.ve.message.Querry;
import org.junit.Test;

import java.util.ArrayList;

import static org.junit.Assert.assertEquals;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 7/10/13
 * Time: 9:34 AM
 * To change this template use File | Settings | File Templates.
 */
public class GeneQueriesTest {

    @Test
    public void constructGeneQueryTest(){
        GeneQueries gq = new GeneQueries();
        Querry q = new Querry();
        ArrayList<String> genes = new ArrayList<String>();
        genes.add("BRCA1");
        genes.add("MTHFR");
        q.setGenes(genes);
        gq.setGeneToken("SNPEFF_GENE_NAME"); //just do this for the unit test so it does not go to Mongo for the info
        BasicDBObject dbObject = gq.constructGeneQuery(q);
        assertEquals("{ \"$or\" : [ { \"INFO.SNPEFF_GENE_NAME\" : \"BRCA1\"} , { \"INFO.SNPEFF_GENE_NAME\" : \"MTHFR\"}]}", dbObject.toString());

        //try it with just one gene in the list
        genes.remove(1); //remove MTHFR
        q.setGenes(genes);
        dbObject = gq.constructGeneQuery(q);
        assertEquals("{ \"$or\" : [ { \"INFO.SNPEFF_GENE_NAME\" : \"BRCA1\"}]}", dbObject.toString());

    }

}
