/**
 * Models that status of Mongo indexes.
 *
 * @type {*}
 */
var IndexesStatus = Backbone.Model.extend({
    defaults: function()
    {
        return {

            /**
             * Number of indexes considered to be ready and available for use.
             */
            numReady: 0
        };
    }
});

