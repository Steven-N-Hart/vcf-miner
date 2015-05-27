package edu.mayo.ve.message;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import edu.mayo.util.Tokens;

import java.util.ArrayList;
import java.util.List;

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
    boolean inSample = true;     //inSample == true means all of the samples must have the variant, inSample = false means that all samples must NOT have the variant
    String zygosity = "either";  // homozygous/heterozygous/either
    int minMatchingSamplesInVariant = 0;
    String allAnySample = "any";     // all/any -- for homo,hetro queries we want to be able to say A) are ALL samples represented in the variant or B) are ANY samples represented in the variant

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

    public int getMinMatchingSamplesInVariant() {
        return minMatchingSamplesInVariant;
    }

    public void setMinMatchingSamplesInVariant(int minMatchingSamples) {
        minMatchingSamplesInVariant = minMatchingSamples;
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

    public void setSamples(List<String> samples){
        ArrayList<String> rep = new ArrayList<String>();
        for(String s : samples){
            rep.add(s);
        }
        this.samples = rep;
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

    public String getZygosity() {
        return zygosity;
    }

    public void setZygosity(String zygosity) {
        this.zygosity = zygosity;
    }

    public String getAllAnySample() {
        return allAnySample;
    }

    public void setAllAnySample(String allAnySample) {
        this.allAnySample = allAnySample;
    }
}
