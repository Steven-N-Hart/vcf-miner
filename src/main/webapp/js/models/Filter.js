// ENUM
var FilterCategory =
{
    UNKNOWN:                0,
    FORMAT:                 1,
    IN_GROUP:               2,
    NOT_IN_GROUP:           3,
    INFO_INT:               4,
    INFO_FLOAT:             5,
    INFO_FLAG:              6,
    INFO_STR:               7,
    ALT_ALLELE_DEPTH:       8
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

// ENUM
var FilterValueFunction =
{
    NONE:   0,
    MIN:    1,
    MAX:    2
}

// MODEL
var Filter = Backbone.Model.extend({
    /**
     * Looks at the filter's current values and tries to be smart about
     * how display value should look.
     *
     * @param filter
     */
    setFilterDisplay: function() {
        this.set("displayName", $.trim(this.getNameAsHTML()));
        this.set("displayValue", $.trim(this.getValueAsHTML()));
        this.set("displayOperator", this.getOperatorAsHTML());
    },

    /**
     * Translates this model into a SampleNumberFilter server-side object.
     * @returns {Object}
     */
    toSampleNumberFilterPojo: function() {
        var pojo = new Object();

        pojo.key = this.get("name");

        pojo.value = parseFloat(this.get("value"));

        pojo.comparator = this.toMongoNumberComparator(this.get("operator"));

        switch(this.get("valueFunction")) {
            case FilterValueFunction.MIN:
                pojo.minORmax='min';
                break;
            case FilterValueFunction.MAX:
                pojo.minORmax='max';
                break;
        }

        //TODO:
//        pojo.includeNulls = this.get("includeNulls");
        pojo.includeNulls = false;

        return pojo;
    },

    /**
     * Translates a SampleNumberFilter server-side object into a Filter model.
     * @param pojo
     */
    fromSampleNumberFilterPojo: function(pojo) {
        var filter = new Filter();

        filter.set("name", pojo.key);
        filter.set("value", pojo.value);
        filter.set("operator", this.toFilterOperator(pojo.comparator));

        if (pojo.minORmax == 'min') {
            filter.set("valueFunction", FilterValueFunction.MIN);
        }
        else if (pojo.minORmax == 'max') {
            filter.set("valueFunction", FilterValueFunction.MAX);
        }
        filter.set("category", FilterCategory.FORMAT);

        return filter;
    },

    /**
     * Translates this model into a InfoFlagFilter server-side object.
     */
    toInfoFlagFilterPojo: function() {
        var pojo = new Object();

        pojo.key = "INFO." + this.get("name");
        pojo.value = this.get("value");

        return pojo;
    },

    /**
     * Translates InfoFlagFilter server-side object into a Filter model.
     * @param pojo
     */
    fromInfoFlagFilterPojo: function(pojo) {
        var filter = new Filter();

        filter.set("name", pojo.key.substring(5));
        filter.set("value", pojo.value);
        filter.set("category", FilterCategory.INFO_FLAG);

        return filter;
    },

    /**
     * Translates this model into a InfoNumberFilter server-side object.
     */
    toInfoNumberFilterPojo: function() {
        var pojo = new Object();

        pojo.key = "INFO." + this.get("name");
        pojo.value = parseFloat(this.get("value"));

        pojo.comparator = this.toMongoNumberComparator(this.get("operator"));
        pojo.includeNulls = this.get("includeNulls");

        return pojo;
    },

    /**
     * Transflates InfoNumberFilter server-side object into a Filter model.
     * @param pojo
     */
    fromInfoNumberFilterPojo: function(pojo) {
        var filter = new Filter();

        filter.set("name", pojo.key.substring(5));
        filter.set("value", pojo.value);
        filter.set("operator", this.toFilterOperator(pojo.comparator));
        filter.set("includeNulls", pojo.includeNulls);
        filter.set("category", FilterCategory.INFO_FLOAT); // TODO: tell if INT or FLOAT?

        return filter;
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
                comparator = '$nin';
                break;
        }
        pojo.comparator = comparator;
        pojo.includeNulls = this.get("includeNulls");

        return pojo;
    },

    /**
     * Translates InfoStringFilter server-side object into a Filter model.
     * @returns {Filter}
     */
    fromInfoStringFilterPojo: function(pojo)
    {
        var filter = new Filter();

        filter.set("name", pojo.key.substring(5));
        filter.set("value", pojo.values);
        filter.set("includeNulls", pojo.includeNulls);

        if (pojo.comparator == '$in') {
            filter.set("operator", FilterOperator.EQ);
        }
        else if (pojo.comparator == '$nin') {
            filter.set("operator", FilterOperator.NE);
        }
        filter.set("category", FilterCategory.INFO_STR);
        return filter;
    },

    /**
     * Translates Filter operator into a MONGO equivalent comparator.
     */
    toMongoNumberComparator: function(filterOperator)
    {
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
        return comparator;
    },

    /**
     * Translates Filter operator into a MONGO equivalent comparator.
     */
    toFilterOperator: function(mongoNumberComparator)
    {
        var operator;

        if (mongoNumberComparator == '')
            operator = FilterOperator.EQ;
        else if (mongoNumberComparator == '$gt')
            operator = FilterOperator.GT;
        else if (mongoNumberComparator == '$gte')
            operator = FilterOperator.GTEQ;
        else if (mongoNumberComparator == '$lt')
            operator = FilterOperator.LT;
        else if (mongoNumberComparator == '$lte')
            operator = FilterOperator.LTEQ;
        else if (mongoNumberComparator == '$ne')
            operator = FilterOperator.NE;

        return operator;
    },

    getNameAsHTML: function()
    {
        var name = this.get("name");
        var nameLabel = '<label title="'+this.get("description")+'">' + name + "</label>";
        var html;

        switch(this.get("valueFunction"))
        {
            case FilterValueFunction.NONE:
                html = nameLabel;
                break;
            case FilterValueFunction.MIN:
                html='<div class="form-inline"><strong>MIN(</strong> ' + nameLabel + ' <strong>)</strong></div>';
                break;
            case FilterValueFunction.MAX:
                html='<div class="form-inline"><strong>MAX(</strong> ' + nameLabel + ' <strong>)</strong></div>'
                break;
        }

        return html;
    },

    getNameAsASCII: function()
    {
        var name = this.get("name");
        var asciiStr = '';

        switch(this.get("valueFunction"))
        {
            case FilterValueFunction.NONE:
                asciiStr=name;
                break;
            case FilterValueFunction.MIN:
                asciiStr='MIN( ' + name + ' )';
                break;
            case FilterValueFunction.MAX:
                asciiStr='MAX( ' + name + ' )'
                break;
        }

        return asciiStr;
    },

    getValueAsHTML: function()
    {
        var value = this.get("value");
        var html = '';

        if (value instanceof Array)
        {
            for (var i = 0; i < value.length; i++)
            {
                html += '<div class="text-left">' + value[i] + '</div>';
            }
        }
        else
        {
            html = '<div class="text-left">' + value + '</div>';
        }

        // check if we need to display whether nulls will be included
        if((this.get("includeNulls") != undefined) && this.get("includeNulls"))
        {
            html += '<div class="text-left">+null</div>';
        }

        return html;
    },

    getValueAsASCII: function()
    {
        var value = this.get("value");
        var asciiStr = '';

        if (value instanceof Array)
        {
            for (var i = 0; i < value.length; i++)
            {
                asciiStr += value[i];

                if ((i+1) < value.length)
                {
                    asciiStr += ', ';
                }
            }
        }
        else
        {
            asciiStr = value;
        }

        // check if we need to display whether nulls will be included
        if((this.get("includeNulls") != undefined) && this.get("includeNulls"))
        {
            asciiStr += ' +null';
        }

        return asciiStr;
    },

    getOperatorAsHTML: function()
    {
        var html;
        switch(this.get("operator"))
        {
            case FilterOperator.UNKNOWN:
                html='';
                break;
            case FilterOperator.EQ:
                html='=';
                break;
            case FilterOperator.GT:
                html='&gt;';
                break;
            case FilterOperator.GTEQ:
                html='&#x2265;';
                break;
            case FilterOperator.LT:
                html='&lt;';
                break;
            case FilterOperator.LTEQ:
                html = '&#x2264;';
                break;
            case FilterOperator.NE:
                html = '&#x2260;';
                break;
        }
        return html;
    },

    /**
     * Translates operator to ASCII friendly characters (e.g. less than or equals would be <=)
     */
    getOperatorAsASCII: function()
    {
        var asciiStr;
        switch(this.get("operator"))
        {
            case FilterOperator.EQ:
                asciiStr='=';
                break;
            case FilterOperator.GT:
                asciiStr='>';
                break;
            case FilterOperator.GTEQ:
                asciiStr='>=';
                break;
            case FilterOperator.LT:
                asciiStr='<';
                break;
            case FilterOperator.LTEQ:
                asciiStr='<=';
                break;
            case FilterOperator.NE:
                asciiStr='!=';
                break;
            default:
                asciiStr='';
        }

        return asciiStr;
    },

    defaults: function()
    {
        return {
            name:            "NA",
            displayName:     "NA",
            description:     "NA",
            operator:        FilterOperator.UNKNOWN,
            displayOperator: "NA",
            valueFunction:   FilterValueFunction.NONE,
            value:           "NA",
            displayValue:    "NA", // may be abbreviated
            numMatches:      0,
            category:        FilterCategory.UNKNOWN,
            id:              guid(),
            includeNulls:    false,
            removable:       false
        };
    }
});
