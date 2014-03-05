package edu.mayo.ve.message;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import edu.mayo.ve.util.Tokens;

import java.util.ArrayList;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 7/10/13
 * Time: 3:46 PM
 *
 * Samples can be collected into groups e.g. if the VCF file contains samples A,B,C,D then we can say
 * IN:[A,B]
 * OUT:[D]
 *
 */
public class SampleGroup {
    String workspace; //the workspace the sampleGroups belong to
    String alias; //the short name or display name for the groups
    String description;
    ArrayList<String> samples = new ArrayList<String>(); //in/out group of samples
    boolean inSample = true; //inSample == true means all of the samples must have the variant, inSample = false means that all samples must NOT have the variant

    public BasicDBObject getBasicDBObject(){
        BasicDBObject b = new BasicDBObject();
        b.put(Tokens.KEY, workspace);
        b.put("alias", alias);
        b.put("description", description);
        BasicDBList l = new BasicDBList();
        for(String s : samples){
            l.add(s);
        }
        b.put("samples", l);
        return b;
    }

    public String getWorkspace() {
        return workspace;
    }

    public void setWorkspace(String workspace) {
        this.workspace = workspace;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public ArrayList<String> getSamples() {
        return samples;
    }

    public void setSamples(ArrayList<String> samples) {
        this.samples = samples;
    }

    public boolean isInSample() {
        return inSample;
    }

    public void setInSample(boolean inSample) {
        this.inSample = inSample;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }

    public String getDescription()
    {
        return this.description;
    }
}
