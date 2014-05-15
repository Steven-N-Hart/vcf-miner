package edu.mayo.ve.resources;


import com.mongodb.*;
import edu.mayo.TypeAhead.TypeAheadCollection;
import edu.mayo.util.Tokens;
import edu.mayo.ve.CacheMissException;
import edu.mayo.ve.util.LastHit;
import edu.mayo.util.MongoConnection;
import edu.mayo.util.SystemProperties;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.regex.Pattern;

@Path("/ve/typeahead")
public class TypeAheadResource {
    Mongo m = MongoConnection.getMongo();

    @GET
    @Path("/w/{workspace_id}/f/{field}")
    @Produces("application/json")
    public String getTypeAhead4Value(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field
    ){
        return getTypeAhead4Value(workspaceID, field,"",Integer.MAX_VALUE);
    }

    public DBObject formatAsJSON(String workspace, String field, List<String> typeAheadResults){
        BasicDBObject ret = new BasicDBObject();
        BasicDBList l = new BasicDBList();
        for(String s : typeAheadResults){
            l.add(s);
        }
        //ret.put(Tokens.KEY.toString(), workspace);
        ret.put(field, l);
        return ret;
    }



    /**
     * gets the approximate number of distinct values for a field
     * e.g.   SNPEFF_EFFECT = [
     1. CODON_CHANGE_PLUS_CODON_DELETION
     2. CODON_CHANGE_PLUS_CODON_INSERTION
     3. CODON_DELETION
     4. CODON_INSERTION
     5. DOWNSTREAM
     6. EXON
     7. EXON_DELETED
     8. FRAME_SHIFT
     9. INTERGENIC
     10. INTRAGENIC
     11. INTRON
     12. NON_SYNONYMOUS_CODING
     13. NON_SYNONYMOUS_START
     14. SPLICE_SITE_ACCEPTOR
     15. SPLICE_SITE_DONOR
     16. START_GAINED
     17. START_LOST
     18. STOP_GAINED
     19. STOP_LOST
     20. SYNONYMOUS_CODING
     21. SYNONYMOUS_STOP
     22. UPSTREAM
     23. UTR_3_PRIME
     24. UTR_5_PRIME
     * @return the number of distinct values e.g. 24 (or in the case of a field that is not indexed the number of values in the cache)
     * if the number is unknown, then it is: Integer.MAX_VALUE.
     */
    @GET
    @Path("/getDistinctCount4Field/w/{workspace_id}/f/{field}")
    @Produces("application/json")
    public String getDistinctCount4Field(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field) throws IOException, CacheMissException {
        if(!field.startsWith("INFO")){
            field = "INFO." + field;
        }
        TypeAheadCollection ta = new TypeAheadCollection();
        Long count = ta.getCount4Field(workspaceID,field);
        DBObject ret = new BasicDBObject();
        ret.put(Tokens.KEY, workspaceID);
        ret.put("field", field);
        ret.put("count", count);
        return ret.toString();
    }

    /**
     * A version of the endpoint without a prefix
     * @param workspaceID  - the key/collection name
     * @param field        - the field we want the type-ahead on e.g. INFO.SNPEFF_GENE
     * @param maxValues    - the maximum number of values to return
     * @return
     */
    @GET
    @Path("/w/{workspace_id}/f/{field}/x/{maxValues}")
    @Produces("application/json")
    public String getTypeAhead4Value(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field,
            @PathParam("maxValues") Integer maxValues
    ){
        return getTypeAhead4Value(workspaceID, field, "", maxValues);
    }

    /**
     *
     * @param workspaceID  - the key/collection name
     * @param field        - the field we want the type-ahead on e.g. INFO.SNPEFF_GENE
     * @param prefix       - the first N characters of the values we want (to show to the user)
     * @param maxValues    - the maximum number of values to return
     * @return
     */
    @GET
    @Path("/w/{workspace_id}/f/{field}/p/{prefix}/x/{maxValues}")
    @Produces("application/json")
    public String getTypeAhead4Value(
            @PathParam("workspace_id") String workspaceID,
            @PathParam("field") String field,
            @PathParam("prefix") String prefix,
            @PathParam("maxValues") Integer maxValues
    ){
        if(!field.startsWith("INFO")){
            field = "INFO." + field;
        }
        TypeAheadCollection ta = new TypeAheadCollection();
        List<String> results = ta.getTypeAhead4Value(workspaceID,field,prefix,maxValues);
        return formatAsJSON(workspaceID,field, results).toString();
    }

}
