var SampleFilterTab = function () {

    // private variables
    var FILTER_MIN_ALT_READS   = new Filter({name: 'Min Alt Reads', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE_MIN_ALT_READS});
    var FILTER_MIN_NUM_SAMPLES = new Filter({name: 'Min # Samples', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE_MIN_NUM_SAMPLES});
    var FILTER_MAX_NUM_SAMPLES = new Filter({name: 'Max # Samples', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE_MAX_NUM_SAMPLES});
    var FILTER_MIN_AC          = new Filter({name: 'Min AC',        operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE_MIN_AC});
    var FILTER_MAX_AC          = new Filter({name: 'Max AC',        operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE_MAX_AC});
    var FILTER_MIN_PHRED       = new Filter({name: 'Min Phred',     operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE_MIN_PHRED});

    var sampleFilters = new FilterList();
    sampleFilters.add([
        FILTER_MIN_ALT_READS,
        FILTER_MIN_NUM_SAMPLES,
        FILTER_MAX_NUM_SAMPLES,
        FILTER_MIN_AC,
        FILTER_MAX_AC,
        FILTER_MIN_PHRED
    ]);

    function reset()
    {
        var sampleFieldList = $('#sample_field_list');
        sampleFieldList.empty();

        for (var i=0; i < sampleFilters.models.length; i++)
        {
            var filter = sampleFilters.models[i];

            sampleFieldList.append("<option value='"+filter.get("id")+"'>"+filter.get("name")+"</option>");

            sampleFieldList.change(function()
            {
                sampleFieldChanged();
            });

            // simulate user clicking on 1st entry
            sampleFieldChanged();
        }

    }

    function sampleFieldChanged()
    {
        // get selected filter
        var filterID = $('#sample_field_list').val();
        var filter = sampleFilters.findWhere({id: filterID});

        // value DIV area
        var valueDiv = $("#sample_value_div");
        // clear div value area
        valueDiv.empty();

        valueDiv.append("<input class='input-mini' type='number' value='0'>");
    }

    // public API
    return {
        /**
         * Resets the state of this tab.
         */
        initialize: function()
        {
            reset();
        },

        /**
         * Gets the selected filter.
         *
         * @return Filter model
         */
        getFilter: function()
        {
            // get selected filter
            var filterID = $('#sample_field_list').val();
            filter = sampleFilters.findWhere({id: filterID});

            // update filter's value based on textfield value
            filter.set("value", $("#sample_value_div input").val());

            return filter;
        }

    };

};