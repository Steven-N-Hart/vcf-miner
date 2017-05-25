var SampleMetadataFieldType = {
    UNKNOWN: 0,
    INTEGER: 1,
    FLOAT: 2,
    STRING: 3,
    BOOLEAN: 4
};

/**
 * Represents following line from a VCF file header
 *
 * ##META=<ID=Field1,Number=1,Type=Float,Description="A sample field of type float.">
 *
 * @type {*}
 */
var SampleMetadataField = Backbone.Model.extend({

    defaults: function() {
        return {
            /* The unique ID. */
            id: "unknown",

            /* The datatype.  */
            type: SampleMetadataFieldType.UNKNOWN,

            /* The description. */
            desc: "unknown"
        };
    }
});
