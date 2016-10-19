package edu.mayo.ve.message;

/**
 * Created with IntelliJ IDEA.
 * User: m102417
 * Date: 12/12/13
 * Time: 2:11 PM
 * DisplayedFilterVariants - A simple class for holding
 * A) filterText - a text description of what filter was applied
 * B) numberVariantsRemaining - a count of the number of variants remaining after the filter is applied
 */
public class DisplayedFilterVariants {
    private String filterText;
    private int numberVariantsRemaining;

    public String getFilterText() {
        return filterText;
    }

    public void setFilterText(String filterText) {
        this.filterText = filterText;
    }

    public int getNumberVariantsRemaining() {
        return numberVariantsRemaining;
    }

    public void setNumberVariantsRemaining(int numberVariantsRemaining) {
        this.numberVariantsRemaining = numberVariantsRemaining;
    }
}
