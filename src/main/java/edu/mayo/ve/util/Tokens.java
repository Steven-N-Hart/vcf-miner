/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.mayo.ve.util;

/**
 *
 * @author Daniel J. Quest
 * 
 * The tokens class contains application level constants that we don't want
 * users/admins to modify through sys.properties
 */
public class Tokens {

    //mongodb tokens
    public static final String WORKSPACE_DATABASE = "workspace";
    public static final String USER_DATABASE = "user";    
    public static final String USER_COLLECTION = "users";    
    public static final String METADATA_COLLECTION = "meta";
    public static final String TYPEAHEAD_COLLECTION = "typeahead";
    public static final String FILTER_HISTORY_COLLECTION = "filterHistory";
    public static final String SAMPLE_GROUP_COLLECTION = "sampleGroups";
    public static final String OWNER = "owner";
    public static final String WORKSPACE_ALIAS = "alias";
    public static final String KEY = "key"; //usually used as the identifier for the workspaceID

    //data loading tokens
    public static final String TOTAL_LINE_COUNT = "total_line_count";
    public static final String HEADER_LINE_COUNT = "header_line_count";
    public static final String DATA_LINE_COUNT = "data_line_count";
    public static final String READY_TOKEN = "ready";
    public static final String VCF_LOAD_FILE = "loadfile";
    public static final String TYPE_AHEAD_OVERUN = "type_ahead_overrun";

    //worker pool based tokens
    public static final String VCF_WORKERS = "vcf_workers";
    
    /** Variant count threshold for whether to run range query filter as background process */
    public static final String RANGE_QUERY_BACKGROUND_PROCESS_THRESHOLD_VARIANTS = "rangeThresholdVariants";
    /** BasePair count threshold for whether to run range query filter as background process */
    public static final String RANGE_QUERY_BACKGROUND_PROCESS_THRESHOLD_BASEPAIRS = "rangeThresholdBasePairs";
}
