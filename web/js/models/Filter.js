// ENUM
var FilterCategory =
{
    UNKNOWN:    0,
    SAMPLE:     1,
    GENE:       2,
    GROUP:      3,
    INFO_INT:   4,
    INFO_FLOAT: 5,
    INFO_FLAG:  6,
    INFO_STR:   7
}

// ENUM
var FilterOperator =
{
    UNKNOWN: 0,
    EQ:      1,
    LT:      2,
    LTEQ:    3,
    GT:      4,
    GTEQ:    5,
    NE:      6
}

// MODEL
var Filter = Backbone.Model.extend({
    defaults: function()
    {
        return {
            name:            "NA",
            operator:        FilterOperator.UNKNOWN,
            displayOperator: "NA",
            value:           "NA",
            displayValue:    "NA", // may be abbreviated
            numMatches:      0,
            category:        FilterCategory.UNKNOWN,
            id:              guid()
        };
    }
});
