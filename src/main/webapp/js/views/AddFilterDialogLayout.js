AddFilterDialogLayout = Backbone.Marionette.Layout.extend({

    template: "#add-filter-dialog-layout-template",

    regions: {
        sampleRegion: "#tab_content_sample_region",
        infoRegion: "#tab_content_info_region",
        customRegion: "#tab_content_custom_region",
        subsetRegion: "#tab_content_subset_region"
    },

    events: {
        "click #add_filter_tabs a" : "showTab",
        "click #add_filter" : "addFilter",
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

        // will cause the modal to initialize itself every time it is shown
//        $('#add_filter_modal').on('hidden', function(){
//            $(this).data('modal', null);
//        });

        this.sampleFilterTabLayout = new SampleFilterTabLayout();
        this.infoFilterTabLayout = new InfoFilterTabLayout();
        this.customFilterTabLayout = new CustomFilterTabLayout();

        var workspaceKey = "ws01";
        var userToken = "aaa:bbb";

        // Create empty lists - one for the metadata fields, and one for the full list of SampleFilter objects
        var sampleFilterList  = new SampleFilterList();

        // TODO: We will also pass in the list of Samples to the subset tab which will fetched when the workspaces are fetched:
        var sample1 = new Sample({
            name:"NA00001",
            sampleMetadataFieldKeyValuePairs: {
                "Field 1 - Numeric":            [30.1],
                "Field 2 - String (<= cutoff)": ["A","B"],
                "Field 3 - Boolean":            [true],
                "Disease - String (> cutoff)":  ["Cystic Fibrosis","Down Syndrome"]
            }
        });
        var sample2 = new Sample({
            name:"NA00002",
            sampleMetadataFieldKeyValuePairs: {
                "Field 1 - Numeric":            [2.3, 11.1],
                "Field 2 - String (<= cutoff)": ["C","D"],
                "Field 3 - Boolean":            [false],
                "Disease - String (> cutoff)":  ["Hemophilia","Color blindness"]
            }
        });
        var sample3 = new Sample({
            name:"NA00003",
            sampleMetadataFieldKeyValuePairs: {
                "Field 1 - Numeric":            [19.6, 21.3],
                "Field 2 - String (<= cutoff)": [],
                "Field 3 - Boolean":            [true],
                "Disease - String (> cutoff)":  ["Canavan disease"]
            }
        });

        // Add all the samples to the sampleList
        var sampleList = new SampleList();
        sampleList.add(sample1);
        sampleList.add(sample2);
        sampleList.add(sample3);

        // Initially, make the sampleFilteredList contain the same samples as sampleList
        var sampleSubsetList = new SampleList();
        sampleSubsetList.add(sample1);
        sampleSubsetList.add(sample2);
        sampleSubsetList.add(sample3);

        var options = {
            workspaceKey:       workspaceKey,
            userToken:          userToken,
            metadataFieldList:  MongoApp.workspace.get("sampleMetaFields"),
            sampleFilterList:   sampleFilterList,
            sampleList:         sampleList,
            sampleSubsetList:   sampleSubsetList
        };

        // instantiate a new controller
        this.subsetController = new SubsetController(options);
    },

    onShow: function() {

        this.sampleRegion.show(this.sampleFilterTabLayout);
        this.infoRegion.show(this.infoFilterTabLayout);
        this.customRegion.show(this.customFilterTabLayout);

        this.subsetController.showSubsetTab({region: this.subsetRegion });

        // show modal dialog
        this.$el.parents('.modal').modal();
    },

    /**
     * Adds a filter to the collection of filters that are searched
     */
    addFilter: function() {
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

        if (typeof filter !== 'undefined') {
            filter.setFilterDisplay();
            var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
            MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_ADD, filter, async);
            this.$("#add_filter_close").click();
            this.$('#add_filter_modal').modal('hide')
        }
    },


    onClose: function() {
        this.$el.parents('.modal').modal('hide');
    }
});