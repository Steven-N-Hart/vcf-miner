/**
 *
 * @param workspaceKey
 *      The workspace key.
 * @param sampleNames
 *      An array of strings, each string representing a sample name.
 * @param vcfDataFields
 * @param indexController
 * @returns {{initialize: Function, show: Function}}
 * @constructor
 */
var AddFilterDialog = function (workspace, indexController) {

    // private variables
    var sampleFilterTab = new SampleFilterTab();
    var infoFilterTab   = new InfoFilterTab(indexController);

    $('#add_filter_tabs a').click(function (e)
    {
        e.preventDefault();
        $(this).tab('show');
    })


    // will cause the modal to initialize itself every time it is shown
    $('#add_filter_modal').on('hidden', function(){
        $(this).data('modal', null);
    });

    $('#add_filter').click(function()
    {
        addFilter();
    });

    // ENTER key press causes "Add" button click
    $('#add_filter_modal form').keypress(function (e) {
        var charCode = e.charCode || e.keyCode || e.which;
        if (charCode  == 13) {
            addFilter();

            return false;
        }
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
            MongoApp.trigger("filterAdd", filter);
            $("#add_filter_close").click();
            $('#add_filter_modal').modal('hide')
        }
    }

    function reset()
    {
        sampleFilterTab.initialize();
        infoFilterTab.initialize();
    }

    // public API
    return {

        /**
         *
         * @param workspace
         */
        show: function()
        {
            reset();
            $('#add_filter_modal').modal();
        }
    };

};