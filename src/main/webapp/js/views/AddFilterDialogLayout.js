AddFilterDialogLayout = Backbone.Marionette.Layout.extend({

    template: "#add-filter-dialog-layout-template",

    regions: {
        sampleRegion: "#tab_content_sample_region",
        infoRegion: "#tab_content_info_region",
        customRegion: "#tab_content_custom_region",
        rangeRegion: "#tab_content_range_region"

        // TODO: DISABLED SUBSET
//        subsetRegion: "#tab_content_subset_region"
    },

    events: {
        "click #add_filter_tabs a" : "showTab",
        "click #run_filter" : "addFilter",
        "click #run_combo_filter" : "runComboFilter",
        "click #add_another_filter" : "addAnother",
        "click .cancel" : "cancelComboFilter",
        "keypress #add_filter_modal form" : "formKeyPress"
    },

    showTab: function(e) {
        e.preventDefault();
        $(e.currentTarget).tab('show');
    },

    formKeyPress: function(e) {
        // ENTER key press causes "Add" button click
        var charCode = e.charCode || e.keyCode || e.which;
        if (charCode  == 13) {
            addFilter();

            return false;
        }
    },

    /**
     * Called when the view is first created
     */
    initialize: function() {

        this.sampleFilterTabLayout = new SampleFilterTabLayout();
        this.infoFilterTabLayout = new InfoFilterTabLayout();
        this.customFilterTabLayout = new CustomFilterTabLayout();
        this.rangeFilterTabLayout = new RangeQueryFilterTabLayout();

        var workspaceKey = "ws01";
        var userToken = "aaa:bbb";

        // Create empty lists - one for the metadata fields, and one for the full list of SampleFilter objects
        var sampleFilterList  = new SampleFilterList();

        // TODO: DISABLED SUBSET
//        var options = {
//            workspaceKey:       workspaceKey,
//            userToken:          userToken,
//            metadataFieldList:  MongoApp.workspace.get("sampleMetaFields"),
//            sampleFilterList:   sampleFilterList,
//            sampleList:         MongoApp.workspace.get("samples"),
//            sampleSubsetList:   MongoApp.workspace.get("samples").clone() // Initially, make the sampleFilteredList contain the same samples as sampleList
//        };
//
//        // instantiate a new controller
//        this.subsetController = new SubsetController(options);
    },

    onShow: function() {

        this.sampleRegion.show(this.sampleFilterTabLayout);
        this.infoRegion.show(this.infoFilterTabLayout);
        this.customRegion.show(this.customFilterTabLayout);
        this.rangeRegion.show(this.rangeFilterTabLayout);

        // TODO: DISABLED SUBSET
//        this.subsetController.showSubsetTab({region: this.subsetRegion });

        // show modal dialog
        this.$el.parents('.modal').modal();
    },

    /**
     * Adds a filter to the collection of filterSteps that are searched
     */
    addFilter: function() {

        var filter = this.getCurrentFilter();
        if (filter === undefined) {
            return;
        }

        var newFilterStep = new FilterStep();
        newFilterStep.get("filters").add(filter);

        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_ADD, newFilterStep);

        var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_CHANGED, MongoApp.search, async);

        this.close();
    },

    /**
     * Adds a filter to the collection of filterSteps that are searched, but does not execute it right away.
     */
    addAnother: function() {

        var filter = this.getCurrentFilter();
        if (filter === undefined) {
            return;
        }

        if (this.comboFilterStep == undefined) {

            // swap out buttons
            $('#run_filter').toggle();
            $('#run_combo_filter').toggle();

            this.comboFilterStep = new FilterStep();
            this.comboFilterStep.get("filters").add(filter);

            var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
            MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_ADD, this.comboFilterStep, async);
        } else {
            this.comboFilterStep.get("filters").add(filter);
            // force model change
            this.comboFilterStep.set("forceUpdate", guid());
        }

        // update button text
        $('#run_combo_filter').text('Run ' + this.comboFilterStep.get("filters").length + ' Filter(s)');
    },


    runComboFilter: function() {

        var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_CHANGED, MongoApp.search, async);

        this.close();
    },

    cancelComboFilter: function() {
        // remove the COMBO filter step
        if (this.comboFilterStep !== undefined) {
            var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
            MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_REMOVE, this.comboFilterStep, async);
        }

        this.close();
    },

    /**
     * Builds a {@link Filter} model based on the user's selections and current tab.
     * @returns {*}
     */
    getCurrentFilter: function() {
        // determine ID of currently selected tab
        var tabId = this.$("ul#add_filter_tabs li.active > a").attr("href").split("#")[1];

        // construct filter object
        var filter;
        switch(tabId) {
            case "tab_content_sample":
                if (this.sampleFilterTabLayout.validate())
                    filter = this.sampleFilterTabLayout.getFilter();
                break;

            case "tab_content_info":
                if (this.infoFilterTabLayout.validate())
                    filter = this.infoFilterTabLayout.getFilter();
                break;
            case "tab_content_custom":
                if (this.customFilterTabLayout.validate())
                    filter = this.customFilterTabLayout.getFilter();
                break;
        }


        if (filter !== undefined) {
            filter.setFilterDisplay();
        }

        return filter;
    },

    onClose: function() {
        this.$el.parents('.modal').modal('hide');
    }
});