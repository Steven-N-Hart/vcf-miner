package edu.mayo.ve.VCFParser;

/**
 * Created by m102417 on 6/30/14.
 */
public class ErrorStats {
    public ErrorStats() {
    }

    public ErrorStats(int errors, int warnings) {
        this.errors = errors;
        this.warnings = warnings;
    }

    private int errors = 0;
    private int warnings = 0;

    public int getErrors() {
        return errors;
    }

    public void setErrors(int errors) {
        this.errors = errors;
    }

    public int getWarnings() {
        return warnings;
    }

    public void setWarnings(int warnings) {
        this.warnings = warnings;
    }
}
