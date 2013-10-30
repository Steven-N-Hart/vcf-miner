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
    NE:      6,
    IN:      7,
    NOT_IN:  8
}

// MODEL
var Filter = Backbone.Model.extend({
    /**
     * Translates this model into a InfoFlagFilter server-side object.
     */
    toInfoFlagFilterPojo: function()
    {
        var pojo = new Object();

        pojo.key = "INFO." + this.get("name");

        pojo.value = this.get("value");

//        var comparator;
//        switch(this.get("operator"))
//        {
//            case FilterOperator.EQ:
//                comparator='';
//                break;
//            case FilterOperator.NE:
//                comparator = '$ne';
//                break;
//        }
//        pojo.comparator = comparator;

        return pojo;
    },

    /**
     * Translates this model into a InfoNumberFilter server-side object.
     */
    toInfoNumberFilterPojo: function()
    {
        var pojo = new Object();

        pojo.key = "INFO." + this.get("name");

        pojo.value = this.get("value");

        var comparator;
        switch(this.get("operator"))
        {
            case FilterOperator.EQ:
                comparator='';
                break;
            case FilterOperator.GT:
                comparator='$gt';
                break;
            case FilterOperator.GTEQ:
                comparator='$gte';
                break;
            case FilterOperator.LT:
                comparator='$lt';
                break;
            case FilterOperator.LTEQ:
                comparator = '$lte';
                break;
            case FilterOperator.NE:
                comparator = '$ne';
                break;
        }
        pojo.comparator = comparator;

        return pojo;
    },

    /**
     * Translates the given Filter model into a InfoStringFilter server-side object.
     */
    toInfoStringFilterPojo: function()
    {
        var pojo = new Object();

        pojo.key = "INFO." + this.get("name");

        var value = this.get("value");
        var displayValue = '';

        if (value instanceof Array)
        {
            pojo.values = value;
        }
        else
        {
            var values = new Array();
            values.push(this.get("value"));
            pojo.values = values;
        }

        var comparator;
        switch(this.get("operator"))
        {
            case FilterOperator.EQ:
                comparator='$in';
                break;
            case FilterOperator.NE:
                comparator = '$ne';
                break;
        }
        pojo.comparator = comparator;

        return pojo;
    },

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
