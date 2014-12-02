/**
 * Represents a sample.
 */
Sample = Backbone.Model.extend({

    defaults: function() {
        return {

            /** The name.  */
            name: "unknown",

            /** Sample metadata fields (key-value pairs).  Ex:  { Field1: "30.1", Field2: "PASS", Field3: "true", Disease: "Cystic Fibrosis" }
             *  NOTE: Values will be single-values, NOT arrays!  */
            sampleMetadataFieldKeyValuePairs: { }
        };
    }
});
