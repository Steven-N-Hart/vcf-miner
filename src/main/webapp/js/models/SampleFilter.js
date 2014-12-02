var SampleFilterOperator = {
    UNKNOWN: "",
    EQ:   "=",
    NEQ:  "!=",
    GT:   ">",
    GTEQ: ">=",
    LT:   "<",
    LTEQ: "<="
};


/**
 * Represents a filter for a sample.
 */
var SampleFilter = Backbone.Model.extend({

    defaults: function() {
        return {

            /**
             * The datatype.
             */
            operator: SampleFilterOperator.UNKNOWN,

            /**
             * Values chosen by the user  (an ARRAY of values since the user can select 0..n depending on the number of options available).
             * Depends on the {@link SampleMetadataField} datatype what this can be.
             *
             * Integer,Float: Javascript number primitive - this will be a single value
             * Boolean: Javascript boolean primitive - this will be a single value of "true" or "false"
             * String: Array of Javascript String primitives
             */
            values: null,

            /**
             * The {@link SampleMetadataField} this filter is bound to.
             */
            metadataField: null
        };
    }
});
