var AddFilterDialog = function () {

    // private variables
    var sampleFilterTabRegion = new Backbone.Marionette.Region({
        el: "#tab_content_sample_region"
    });
    var sampleFilterTabLayout = new SampleFilterTabLayout();

    var infoFilterTabRegion = new Backbone.Marionette.Region({
        el: "#tab_content_info_region"
    });
    var infoFilterTabLayout = new InfoFilterTabLayout();

    var customFilterTabRegion = new Backbone.Marionette.Region({
        el: "#tab_content_custom_region"
    });
    var customFilterTabLayout = new CustomFilterTabLayout();

    $('#add_filter_tabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    })

    // will cause the modal to initialize itself every time it is shown
    $('#add_filter_modal').on('hidden', function(){
        $(this).data('modal', null);
    });

    $('#add_filter').click(function() {
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
    function addFilter() {
        // determine ID of currently selected tab
        var tabId = $("ul#add_filter_tabs li.active > a").attr("href").split("#")[1];

        // construct filter object
        var filter;
        switch(tabId) {
            case "tab_content_sample":
                if (sampleFilterTabLayout.validate())
                    filter = sampleFilterTabLayout.getFilter();
                break;

            case "tab_content_info":
                if (infoFilterTabLayout.validate())
                    filter = infoFilterTabLayout.getFilter();
                break;
            case "tab_content_custom":
                if (customFilterTabLayout.validate())
                    filter = customFilterTabLayout.getFilter();
                break;
        }

        if (typeof filter !== 'undefined') {
            filter.setFilterDisplay();
            var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
            MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_ADD, filter, async);
            $("#add_filter_close").click();
            $('#add_filter_modal').modal('hide')
        }
    }

    // public API
    return {

        /**
         *
         * @param workspace
         */
        show: function() {
            sampleFilterTabRegion.show(sampleFilterTabLayout);
            infoFilterTabRegion.show(infoFilterTabLayout);
            customFilterTabRegion.show(customFilterTabLayout);

            $('#add_filter_modal').modal();
        }
    };

};