// Should we put anything in here or just fetch the values within the controller????
/** A Range Query */
var RangeQuery = Backbone.Model.extend({

    defaults: function() {
        return {

            /** User-supplied name for the range query */
            name: null,

            /** Description of the range query */
            description: null,

            /** User-entered range queries in the rich-text area */
            ranges: null,

            /** Filename to upload as a set of ranges */
            filename: null
        };
    }
});
