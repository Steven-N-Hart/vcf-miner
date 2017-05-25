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
        "click #createRangeAnnotation": "createRangeAnnotation",
        "click .cancel" : "cancelComboFilter",
        "keypress #add_filter_modal form" : "formKeyPress"
    },

    showTab: function(e) {
        e.preventDefault();
        $(e.currentTarget).tab('show');

        var tabId = $(e.currentTarget).attr("href").split("#")[1];

        // based on which tab is selected, show the correct action buttons
        if (tabId == 'tab_content_range') {
            $('#filterActionButtons').hide();
            $('#rangeActionButtons').show();
        } else {
            $('#filterActionButtons').show();
            $('#rangeActionButtons').hide();
        }
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
    initialize: function(options) {

        this.localDispatcher = options.localDispatcher;

        var that = this;
        this.localDispatcher.on("tabFinished", function(){
            that.close();
        });

        this.sampleFilterTabLayout = new SampleFilterTabLayout();
        this.infoFilterTabLayout = new InfoFilterTabLayout();
        this.customFilterTabLayout = new CustomFilterTabLayout();
        this.rangeFilterTabLayout = new RangeQueryFilterTabLayout({localDispatcher: this.localDispatcher});

        var workspaceKey = "ws01";
        var userToken = "aaa:bbb";

        // Create empty lists - one for the metadata fields, and one for the full list of SampleFilter objects
        var sampleFilterList  = new SampleFilterList();

        // TODO: DISABLED SUBSET
//        var options = {
//            workspaceKey:       workspaceKey,
//            userToken:          userToken,
//            metadataFieldList:  MongoApp.workspaceKey.get("sampleMetaFields"),
//            sampleFilterList:   sampleFilterList,
//            sampleList:         MongoApp.workspaceKey.get("samples"),
//            sampleSubsetList:   MongoApp.workspaceKey.get("samples").clone() // Initially, make the sampleFilteredList contain the same samples as sampleList
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

        // by default, have the Annotation (INFO) tab selected
        this.$el.find('a[href="#tab_content_info"]').click();
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
    },

    createRangeAnnotation: function() {
        this.localDispatcher.trigger("createRangeAnnotation");
    },

    addFilter: function() {
        var filter = this.getCurrentFilter();
        if (filter === undefined) {
            return;
        }
        this.localDispatcher.trigger("addFilter", filter);
        this.close();
    },

    addAnother: function() {
        var filter = this.getCurrentFilter();
        if (filter === undefined) {
            return;
        }
        this.localDispatcher.trigger("addAnother", filter);
    },

    runComboFilter: function() {
        this.localDispatcher.trigger("runCombo");
        this.close();
    },

    cancelComboFilter: function() {
        this.localDispatcher.trigger("cancelCombo");
        this.close();
    }
});