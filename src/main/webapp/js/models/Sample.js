/**
 * Represents a sample.
 */
Sample = Backbone.Model.extend({

    defaults: function() {
        return {

            /** The name.  */
            name: "unknown",

            /**
             * Sample metadata fields (key-value pairs).
             *
             * given this:
             *
             * ##META=<ID=Field1,Number=.,Type=Float,Values=[],Description="A float field">
             * ##META=<ID=Field2,Number=.,Type=String,Values=[],Description="String field">
             * ##META=<ID=Field3,Number=0,Type=Flag,Values=[],Description="A flag field">
             * ##SAMPLE=<ID=NA00001;Field1=19.6,21.3;Field2=B;Field3;>
             *
             * would give the following object:
             *
             * {
             *      "Field1" : [19.6, 21.3],
             *      "Field2" : ["B"],
             *      "Field3" : [true]
             * }
             *
             */
            sampleMetadataFieldKeyValuePairs: { }
        };
    }
});
