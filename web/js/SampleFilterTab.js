var SampleFilterTab = function (sampleFilters) {

    // private variables

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
        var filter = PALLET_FILTER_LIST.findWhere({id: filterID});

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