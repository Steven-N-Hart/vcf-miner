var AddFilterDialog = function (infoFilters, searchedFilters, sampleGroups) {

    // private variables
    var workspaceKey;
    var sampleFilterTab = new SampleFilterTab(sampleGroups);
    var infoFilterTab   = new InfoFilterTab(infoFilters);

    $('#add_filter').click(function()
    {
        addFilter();
    });

    /**
     * Adds a filter to the collection of filters that are searched
     */
    function addFilter()
    {
        // determine ID of currently selected tab
        var tabId = $("ul#add_filter_tabs li.active > a").attr("href").split("#")[1];

        // construct filter object
        var filter;
        switch(tabId)
        {
            case "tab_content_sample":
                if (sampleFilterTab.validate())
                    filter = sampleFilterTab.getFilter();
                break;

            case "tab_content_info":
                if (infoFilterTab.validate())
                    filter = infoFilterTab.getFilter();
                break;
        }

        if (typeof filter !== 'undefined')
        {
            filter.setFilterDisplay();
            searchedFilters.add(filter);
            $("#add_filter_close").click();
            $('#add_filter_modal').modal('hide')
        }
    }

    function reset()
    {
    }

    // public API
    return {
        /**
         * Resets the state of the dialog.
         *
         * @param ws
         *      The workspace key.
         * @param sampleNames
         *      An array of strings, each string representing a sample name.
         */
        initialize: function(ws, sampleNames)
        {
            workspaceKey = ws;

            sampleFilterTab.initialize(workspaceKey, sampleNames);
            infoFilterTab.initialize(workspaceKey);
        },

        /**
         * Shows the dialog
         */
        show: function()
        {
            reset();

            $('#add_filter_tabs a').click(function (e)
            {
                e.preventDefault();
                $(this).tab('show');
            })

            $('#add_filter_modal').modal();
        }
    };

};