// ENUM
var FilterCategory =
{
    UNKNOWN:                0,
    SAMPLE_MIN_ALT_READS:   1,
    SAMPLE_MIN_NUM_SAMPLES: 2,
    SAMPLE_MAX_NUM_SAMPLES: 3,
    SAMPLE_MIN_AC:          4,
    SAMPLE_MAX_AC:          5,
    SAMPLE_MIN_PHRED:       6,
    GENE:                   7,
    IN_GROUP:               8,
    NOT_IN_GROUP:           9,
    INFO_INT:               10,
    INFO_FLOAT:             11,
    INFO_FLAG:              12,
    INFO_STR:               13
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
    /**
     * Looks at the filter's current values and tries to be smart about
     * how display value should look.
     *
     * @param filter
     */
    setFilterDisplay: function()
    {
        var value = this.get("value");
        var displayValue = '';

        if (value instanceof Array)
        {
            for (var i = 0; i < value.length; i++)
            {
                displayValue += '<div class="text-left">' + value[i] + '</div>';
            }
        }
        else
        {
            displayValue = '<div class="text-left">' + value + '</div>';
        }

        // check if we need to display whether nulls will be included
        switch(this.get("category"))
        {
            case FilterCategory.INFO_FLOAT:
            case FilterCategory.INFO_INT:
            case FilterCategory.INFO_STR:
                if (this.get("includeNulls"))
                {
                    displayValue += '<div class="text-left">+null</div>';
                }
                break;
        }

        this.set("displayValue", $.trim(displayValue));

        var displayOperator;
        switch(this.get("operator"))
        {
            case FilterOperator.UNKNOWN:
                displayOperator='';
                break;
            case FilterOperator.EQ:
                displayOperator='=';
                break;
            case FilterOperator.GT:
                displayOperator='&gt;';
                break;
            case FilterOperator.GTEQ:
                displayOperator='&#x2265;';
                break;
            case FilterOperator.LT:
                displayOperator='&lt;';
                break;
            case FilterOperator.LTEQ:
                displayOperator = '&#x2264;';
                break;
            case FilterOperator.NE:
                displayOperator = '&#x2260;';
                break;
            case FilterOperator.IN:
                displayOperator = 'IN';
                break;
            case FilterOperator.NOT_IN:
                displayOperator = 'NOT_IN';
                break;
        }
        this.set("displayOperator", displayOperator);
    },

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
        pojo.includeNulls = this.get("includeNulls");

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
        pojo.includeNulls = this.get("includeNulls");

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
            id:              guid(),
            includeNulls:    false
        };
    }
});
