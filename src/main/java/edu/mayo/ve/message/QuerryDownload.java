package edu.mayo.ve.message;

import com.mongodb.BasicDBObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

/**
 * The primary difference between a Querry object and a QuerryDownload object is that
 * in the case of the QuerryDownload, we are assuming that the requester wants a TAB-Delimited
 * file based on the columns they have selected in the user interface.
 * The simple list of strings, returnFields helps specify that we only want a specific subset
 * of fields for download.  In all other ways, the message objects are idential.
 *
 *
 * User: m102417
 * Date: 10/8/13
 * Time: 8:54 AM
 * To change this template use File | Settings | File Templates.
 */
public class QuerryDownload extends Querry {

    /** a special field for those cases where we want to download a tab delimited file and we only need certain fields - this is the representation in the database */
    ArrayList<String> returnFields = new ArrayList<String>();
    /** display fields has the same order as returnFields, but instead of being what the database calls the field, it is what the header should be (so it can match what was in the display and not confuse users)*/
    ArrayList<String> displayFields = new ArrayList<String>();

    /** displays in the header the filters applied to get the result set (optional)
     * e.g.
     * Filter	Variants
     * none			                   7178
     * STR	= true                      213

     * HaplotypeScore	=	0.0 +null   213
     */
    ArrayList<DisplayedFilterVariants> displayFiltersApplied = new ArrayList<DisplayedFilterVariants>();


    /**
     * for performance, we don't want the entire object comming back, but because we can't know if Mongo stored something
     * in an array, string double or object, we want to get back the higher level elements (e.g. INFO) and then
     * let Java do the traversal inside of these documents. and deal with costom format conversion.
     * @return
     */
    public BasicDBObject getCustomReturnSelect(){
        BasicDBObject q = new BasicDBObject();
        Set<String> topLevelFields = new HashSet<String>();
        for(String field : returnFields){
            if(field.contains(".")){
                String[] split = field.split("\\.");
                topLevelFields.add(split[0]);
            }else{
                q.append(field,1);
            }
        }
        for(String s : topLevelFields){
            q.append(s,1);
        }
        return q;
    }

    /**
     *
     * @param b      the object we are building up
     * @param path   the query path e.g. INFO.CSQ.FOO.BAR
     *
     * @return       a nested set of BasicDBObject coresponding to the drill path e.g. (INFO ( CSQ ( FOO ( BAR : 1 ) ) ) )
     */
    public BasicDBObject nest(BasicDBObject b, String path){
        if(path.contains(".")){
            BasicDBObject ob = new BasicDBObject();
            String[] split = path.split("\\.");
            String newpath = path.replace(split[0] + ".", "");
            b.append(split[0], nest(ob, newpath));
        }else {
            b.append(path,1);
        }
        return b;
    }

    public ArrayList<String> getReturnFields() {
        return returnFields;
    }

    public void setReturnFields(ArrayList<String> returnFields) {
        this.returnFields = returnFields;
    }

    public ArrayList<String> getDisplayFields() {
        return displayFields;
    }

    public void setDisplayFields(ArrayList<String> displayFields) {
        this.displayFields = displayFields;
    }

    public ArrayList<DisplayedFilterVariants> getDisplayFiltersApplied() {
        return displayFiltersApplied;
    }

    public void setDisplayFiltersApplied(ArrayList<DisplayedFilterVariants> displayFiltersApplied) {
        this.displayFiltersApplied = displayFiltersApplied;
    }


}
