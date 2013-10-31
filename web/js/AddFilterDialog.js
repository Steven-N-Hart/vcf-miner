var AddFilterDialog = function (infoFilters, searchedFilters, sampleGroups, sampleFilters) {

    // private variables
    var workspaceKey;
    var sampleFilterTab = new SampleFilterTab(sampleFilters);
    var geneFilterTab   = new GeneFilterTab();
    var groupFilterTab  = new GroupFilterTab(sampleGroups);
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
                filter = sampleFilterTab.getFilter();
                break;

            case "tab_content_gene":
                filter = geneFilterTab.getFilter();
                break;

            case "tab_content_group":
                filter = groupFilterTab.getFilter();
                break;

            case "tab_content_info":
                filter = infoFilterTab.getFilter();
                break;
        }

        filter.setFilterDisplay();
        searchedFilters.add(filter);
        $("#add_filter_close").click();
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

            sampleFilterTab.initialize();
            geneFilterTab.initialize(workspaceKey);
            groupFilterTab.initialize(workspaceKey, sampleNames);
            infoFilterTab.setWorkspace(workspaceKey);
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