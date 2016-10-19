package edu.mayo.ve.resources;

import com.mongodb.*;
import edu.mayo.util.Tokens;
import edu.mayo.ve.message.Querry;
import edu.mayo.index.Index;
import edu.mayo.util.MongoConnection;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 7/9/13
 * Time: 12:47 PM
 * To change this template use File | Settings | File Templates.
 */
@Path("/ve/gene")
public class GeneQueries {
    Mongo m = MongoConnection.getMongo();
    String geneToken = null;

    public String getGeneToken() {
        return geneToken;
    }

    public void setGeneToken(String geneToken) {
        this.geneToken = geneToken;
    }

    /**
     * Interogate the metadata for a given workspace to determine how genes are represented.
     * Options include:
     * INFO.SNPEFF_GENE_NAME
     * INFO.GENE
     * Typically this represents Gene name for the highest-impact effect resulting from the current variant
     */
    @GET
    @Path("/w/{workspace_id}")
    @Produces("application/json")
    public String howAreGenesRepresentedInINFO(@PathParam("workspace_id") String workspaceID) {
        String ret = "";
        DB db = MongoConnection.getDB();
        DBCollection coll = db.getCollection(Tokens.METADATA_COLLECTION);
        BasicDBObject query = new BasicDBObject();
        query.put("key",workspaceID);
        DBCursor meta = coll.find(query);
        for(int i=0; meta.hasNext(); i++){
            //should be only 1
            DBObject next =meta.next();
//            for( String key : next.keySet() ){
//                System.out.println(key);
//            }
            BasicDBObject info = (BasicDBObject) next.get("INFO");
            if(info == null) return ret;
            for( String key : info.keySet() ){
                //System.out.println(key);
                if(key.equalsIgnoreCase("SNPEFF_GENE_NAME")){
                    return "SNPEFF_GENE_NAME"; //1st choice
                }
                if(key.equalsIgnoreCase("GENE") && ret.length()!=0){
                    ret = "GENE"; //3rd choice
                }
                if(key.equalsIgnoreCase("GENE_NAME")){
                    ret = "GENE_NAME";//2nc choice
                }

            }
        }
        return ret;
    }

    /**
     * for a given workspace, we will need to index the genes if it has not already been done
     */
    @GET
    @Path("/index/w/{workspace_id}")
    @Produces("application/json")
    public String applyIndex(@PathParam("workspace_id") String workspaceID){
        //what the heck do we need to index?
        if(this.geneToken == null){
            this.geneToken = howAreGenesRepresentedInINFO(workspaceID);
        }

        //check to see if the index exists
        Index index = new Index();
        DB db = MongoConnection.getDB();
        DBCollection col = db.getCollection(workspaceID);
        if(index.hasIndex(col, "key", "INFO.SNPEFF_GENE_NAME")){
            return "{\"status\":\"index exists\"}";
        }else{
            //apply the index
            BasicDBObject o = new BasicDBObject();
            o.append("INFO." + this.geneToken, 1);
            col.ensureIndex(o);
            return "{\"status\":\"index applied\"}";
        }
    }


    /**
     * For a given workspace, get all the genes and return that as a json list
     */
    @GET
    @Path("/getGenes/w/{workspace_id}")
    @Produces("application/json")
    public String getGenes(@PathParam("workspace_id") String workspaceID){
        //what is the name of the field holding the genes?
        if(this.geneToken == null){
            this.geneToken = howAreGenesRepresentedInINFO(workspaceID);
        }
        //get all the distinct genes... in mongo this is expressed as thus:
        //db.w098898c6cce952e98923db053bb526c9d603f40d.distinct( 'INFO.SNPEFF_GENE_NAME' )
        DB db = MongoConnection.getDB();
        DBCollection coll = db.getCollection(workspaceID);
        BasicDBObject query = new BasicDBObject();

        BasicDBList l = (BasicDBList) coll.distinct("INFO." + this.geneToken);
        if(l == null || l.size() < 1){
            l = new BasicDBList();
            return l.toString();
        }else {
            if(l.get(0)==null){
                l.remove(0);  //the first value is null for some reason :(
            }
        }
        return l.toString();

    }


    /**
     * assuming that values for the gene are in the INFO field, then construct a query that will find
     * all variants that are implicated in damaging some gene in the list of genes provided.
     * @input - a list of genes specified in a Querry object
     * @return - a query expressed as a BasicDBObject to get back the variants that are damaged by the genes specified in the input list
     */
    public BasicDBObject constructGeneQuery(Querry q){
        BasicDBObject query = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        //First, what the heck is the term used for gene in the info column for this workspace?
        if(this.geneToken == null){
            this.geneToken = howAreGenesRepresentedInINFO(q.getWorkspace());
        }
        //this workspace does not have genes defined in the info column, return a blank query.
        if(this.geneToken.length() < 3){
            return query;
        }else {  //the workspaces does have genes
            for(String gene : q.getGenes()){
                BasicDBObject clause = new BasicDBObject();
                clause.put("INFO."+this.geneToken, gene);
                l.add(clause);
            }
            query.append("$or", l);
            return query;
        }
    }
}
