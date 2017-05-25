package edu.mayo.ve.message;

import java.util.List;

/**
 * POJO used for passing information necessary to subset a workspace (e.g. VCF).
 */
public class SubsetInfo {
    /**
     * {@link Querry} that captures any existing workspace filters.
     */
    Querry querry;

    /**
     * {@link List} of strings, each string representing a sample ID
     *
     * Example: "foo" is the sample ID for the following:
     *
     * ##SAMPLE<ID=foo
     */
    List<String> samples;

    public void setQuerry(Querry q) {
        querry = q;
    }

    public Querry getQuerry() {
        return querry;
    }

    public void setSamples(List<String> samples) {
        this.samples = samples;
    }

    public List<String> getSamples() {
        return this.samples;
    }
}
