// ENUM
var IndexStatus =
{
    NONE:     'NONE',
    BUILDING: 'BUILDING',
    READY:    'READY',
    DROPPING: 'DROPPING'
};

var DatabaseIndex = Backbone.Model.extend({
    defaults: function()
    {
        return {
            name: "unknown",

            /**
             * Corresponding data field the index is built for.
             */
            dataField: new VCFDataField(),

            /**
             * Status of the index
             */
            status: IndexStatus.NONE,

            /**
             * An integer value 0-100
             */
            progress: 0
        };
    }
});

