// ENUM
var ReadyStatus =
{
    UNKNOWN:    -2,
    FAILED:     -1,
    READY:      1,
    QUEUED:     2,
    IMPORTING:  3,
    INDEXING:   4,
    ANNOTATING: 5
}

var Workspace = Backbone.Model.extend({
    defaults: function()
    {
        return {
            date:   null,
            key:    "NA",
            alias:  "NA",
            user:   "NA",
            status: ReadyStatus.UNKNOWN,
            id:     guid(),
            dataFields: new VCFDataFieldList(),
            sampleNames: new Array(),
            sampleGroups: new SampleGroupList(),
            sampleMetaFields: new SampleMetadataFieldList(),
            samples: new SampleList(),
            statsErrors: 0,
            statsWarnings: 0,
            statsNumVariants: 0,
            statsTotalVariants:0,
            statsNumAnnotations: 0,
            statsTotalAnnotations:0
        };
    }
});

