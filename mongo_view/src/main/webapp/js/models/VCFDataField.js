// ENUM
var VCFDataCategory =
{
    /**
     * Represents data fields from columns 1-7.
     */
    GENERAL: 'GENERAL',

    /**
     * Represents data fields for the INFO column.
     */
    INFO: 'INFO',

    /**
     * Represents data fields for the FORMAT column.
     */
    FORMAT: 'FORMAT'
};

// ENUM
var VCFDataType =
{
    UNKNOWN:   'UNKNOWN',
    INTEGER:   'INTEGER',
    FLOAT:     'FLOAT',
    CHARACTER: 'CHARACTER',
    STRING:    'STRING',
    FLAG:      'FLAG'
};

/**
 * Models a VCF data field present in the INFO or FORMAT.
 *
 * @type {*}
 */
var VCFDataField = Backbone.Model.extend({
    defaults: function()
    {
        return {

            /**
             * Category of the field (e.g. what column does it belong to)
             */
            category: VCFDataCategory.GENERAL,

            /**
             * Name of the field
             */
            name: "unknown",

            /**
             * Datatype for the field.
             */
            type: VCFDataType.UNKNOWN,

            /**
             * Description of the field.
             */
            description: "unknown"
        };
    }
});

