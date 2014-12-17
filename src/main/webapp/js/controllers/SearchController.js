/**
 * Controller for Search related objects.
 * @type {*}
 */
var SearchController = Backbone.Marionette.Controller.extend({

    /**
     * Backbone collection of Workspace models.
     */
    searches: new SearchList(),

    searchNameView: null,

    searchFilterView: null,

    initialize: function (options) {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_FILTER_ADD, function (filter, async) {
            self.addFilter(filter, async);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_FILTER_REMOVE, function (filter) {
            self.removeFilter(filter);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_SAVE, function (search) {
            self.saveSearch(search);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_DELETE, function (search) {
            self.deleteSearch(search);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_SHOW_DIALOG, function () {
            self.showSearchDialog();
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_EXPORT, function (search) {
            self.exportSearch(search);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_IMPORT, function (filterHistoryJsonText) {
            self.importSearch(filterHistoryJsonText);
        });
    },

    showSearchName: function(options) {
        this.searchNameView = new SearchNameView({model: MongoApp.search});

        options.region.show(this.searchNameView);
    },

    showSearchDescription: function(options) {
        this.searchDescriptionView = new SearchDescriptionView({model: MongoApp.search});

        options.region.show(this.searchDescriptionView);
    },

    showSearchSave: function(options) {
        this.searchSaveView = new SearchSaveView({model: MongoApp.search});

        options.region.show(this.searchSaveView);
    },

    showSearchFilterTable: function (options) {
        this.searchFilterView = new SearchFilterTableView({
            collection: MongoApp.search.get("filters")
        });
        options.region.show(this.searchFilterView);
    },

    addFilter: function (filter, async) {
        MongoApp.showPleaseWait();

        MongoApp.search.get("filters").add(filter);

        if (filter.get('id') != MongoApp.FILTER_NONE.get('id'))
            MongoApp.search.set("saved", false);

        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_ADDED, MongoApp.search, async);
        this.updateFilterRemovable();
    },

    removeFilter: function (filter) {
        MongoApp.showPleaseWait();

        MongoApp.search.get("filters").remove(filter);
        MongoApp.search.set("saved", false);
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_REMOVED, MongoApp.search);
        this.updateFilterRemovable();
    },

    /**
     * Loops through ALL filters and updates their removable attribute.
     */
    updateFilterRemovable: function()
    {
        var lastFilter = _.last(MongoApp.search.get("filters").models);

        // loop through filter collection
        // filter is removable ONLY if it's
        // 1.) not the NONE filter
        // 2.) is the last filter in the list
        var self = this;
        _.each(MongoApp.search.get("filters").models, function(filter)
        {
            var button =  $("#" + filter.get("id") + "_remove_button");
            if ((filter.get("id") != MongoApp.FILTER_NONE.get("id")) &&
                (filter.get("id") == lastFilter.get("id")))
            {
                filter.set("removable", true);
            }
            else
            {
                filter.set("removable", false);
            }
        });
    },

    /**
     * Save search model to back-end
     * @param search
     */
    saveSearch: function(search) {

        var self = this;
        var saveCallback = function() {
            // update model name if user decided to change it
            search.set("name",  $('#search_save_name_field').val());
            search.set("description", $('#search_save_desc_field').val());

            var filterHistory = self.searchToFilterHistory(search);

            $.ajax({
                type: "POST",
                url: "/mongo_svr/ve/filterHistory/save",
                contentType: "application/json",
                data: JSON.stringify(filterHistory),
                dataType: "json",
                success: function(json)
                {
                    var savedSearch = self.filterHistoryToSearch(json);
                    MongoApp.search.set("id", savedSearch.get("id"));
                    MongoApp.search.set("timestamp", savedSearch.get("timestamp"));
                    MongoApp.search.set("saved", true);
                    console.log("save successful!");
                },
                error: jqueryAJAXErrorHandler
            });
        }

        var cancelCallback = function() {};

        var wysihtml5Initialized = false;
        var shownCallback = function(okButton, cancelButton) {
            // by default, set the name to be the model's name
            $('#search_save_name_field').val(search.get("name"));
            $('#search_save_desc_field').val(search.get("description"));

            // focus on input field and highlight text
            $('#search_save_name_field').focus();
            $('#search_save_name_field').select();

            // capture ENTER key event on form
//            $( "#search_save_form" ).submit(function( event ) {
//                // alias ENTER key to clicking on the confirm's OK button
//                okButton.click();
//                event.preventDefault();
//            });

            if (wysihtml5Initialized == false) {
                $('#search_save_desc_field').wysihtml5({stylesheets:[]});
                wysihtml5Initialized = true;
            }
        };

        var html =
                '<div class="container-fluid">' +
                '   <h4>Name</h4>' +
                '   <div class="row-fluid">' +
                '       <div class="span12">' +
                '           <input type="text" id="search_save_name_field" name="search_save_name_field" class="input-medium">' +
                '       </div>' +
                '   </div>'+
                '   <h4>Description</h4>' +
                '   <div class="row-fluid">' +
                '       <div class="span12">' +
                '           <textarea id="search_save_desc_field" name="search_save_desc_field" class="textarea span12" rows="5"></textarea>'+
                '       </div>' +
                '   </div>'+
                '</div>';

        var confirmDialog = new ConfirmDialog("Save Analysis", html, "Save", saveCallback, cancelCallback, shownCallback);
        confirmDialog.show();
    },

    /**
     * Delete search from server.
     *
     * @param search
     */
    deleteSearch: function(search) {

        $.ajax({
            type: "DELETE",
            url: "/mongo_svr/ve/filterHistory/delete/" + search.get('id'),
            dataType: "json",
            success: function(json)
            {
                console.log("delete successful!");
                // TODO: give user feedback

                // if the user deletes the current search, then reload the workspace w/ default search
                if (search.get('id') == MongoApp.search.get('id')) {
                    MongoApp.dispatcher.trigger(MongoApp.events.WKSP_LOAD, MongoApp.workspace, new Search());
                }
            },
            error: jqueryAJAXErrorHandler
        });
    },

    /**
     * Queries server for a current listing of Search objects for the given workspace.
     */
    getSearches: function(workspaceKey) {

        var self = this;

        var searchList = new SearchList();

        // make synchronous REST call to server
        $.ajax({
            url: "/mongo_svr/ve/filterHistory/search/w/" + workspaceKey,
            dataType: "json",
            async: false,
            success: function(json) {

                var filterHistories = json.filterHistories;
                for (var i = 0; i < filterHistories.length; i++) {
                    var search = self.filterHistoryToSearch(filterHistories[i]);
                    searchList.add(search);
                }
            },
            error: jqueryAJAXErrorHandler
        });

        return searchList;
    },

    /**
     * Show configure search dialog
     */
    showSearchDialog: function() {

        // refresh searches
        this.searches.reset();
        this.searches.set(this.getSearches(MongoApp.workspace.get("key")).models);

        var searchTableView = new SearchTableView({
            collection: this.searches
        });

        var region = new Backbone.Marionette.Region({
            el: "#searchTableRegion"
        });
        region.show(searchTableView);
        $('#searches_modal').modal();
    },

    /**
     * Import Search model from a file on client.
     * @param JSON text for filter history javascript object.
     */
    importSearch: function(filterHistoryJsonText) {
        var filterHistory = JSON.parse(filterHistoryJsonText);
        var search = this.filterHistoryToSearch(filterHistory);
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_LOAD, search);
    },

    /**
     * Export Search model to a file on client.
     *
     * @param search
     */
    exportSearch: function(search) {
        var filterHistory = this.searchToFilterHistory(search);
        var data = JSON.stringify(filterHistory);

        // use Data URI to save
        //window.open("data:text/json;charset=utf-8," + encodeURIComponent(data));

        // dynamically add HTML form that is hidden
        var form = $('<form>').attr(
            {
                id:      'export_search_form',
                method:  'POST',
                action:  '/mongo_svr/client_download_proxy',
                enctype: 'application/x-www-form-urlencoded'
            });
        form.append($('<input>').attr({type: 'hidden', name: 'filename', value: search.get("name") + '.json'}));
        form.append($('<input>').attr({type: 'hidden', name: 'mimeType', value: 'application/json'}));
        form.append($('<input>').attr({type: 'hidden', name: 'content', value: data}));
        $("body").append(form);

        // programmatically submit form to perform download
        $('#export_search_form').submit();

        // remove form
        $('#export_search_form').remove();


//
//
//
//        // Now we convert the data to a Data URI Scheme, which must be Base64 encoded
//        // make sure you use the appropriate method to Base64 encode your data depending
//        // on the library you chose to use.
//        // application/octet-stream simply tells your browser to treat the URL as
//        // arbitrary binary data, and won't try to display it in the browser window when
//        // opened.
//        var url = "data:application/octet-stream;base64," + $.base64('encode', data);
//
//        // To force the browser to download a file we need to use a custom method which
//        // creates a hidden iframe, which allows browsers to download any given file
//        var iframe = document.getElementById("hiddenDownloader");
//        if (iframe === null)
//        {
//            iframe = document.createElement('iframe');
//            iframe.id = "hiddenDownloader";
//            iframe.style.display = "none";
//            document.body.appendChild(iframe);
//        }
//        iframe.src = url;
    },

    /**
     * Translates a Search model into a edu.mayo.ve.message.FilterHistory object.
     * @param filterHistory
     */
    searchToFilterHistory: function(search) {
        var filterHistory = new Object();
        filterHistory.id          = search.get("id");
        filterHistory.name        = search.get("name");
        filterHistory.description = search.get("description");
        filterHistory.user        = search.get("user");
        filterHistory.key         = search.get("key");
        filterHistory.filters     = new Array();

        // translate Filter model to Querry object (except for NONE filter)
        _.each(search.get("filters").models, function(filter) {

            var filterList = new FilterList();
            filterList.add(filter);

            var querry = buildQuery(filterList, search.get("key"));

            filterHistory.filters.push(querry);

        });

        return filterHistory;
    },

    /**
     * Translates a edu.mayo.ve.message.FilterHistory object into a Search model.
     * @param filterHistory
     */
    filterHistoryToSearch: function(filterHistory) {
        var search = new Search();

        search.set('id', filterHistory.id);
        search.set('name', filterHistory.name);
        search.set('description', filterHistory.description);
        search.set('user', filterHistory.user);
        search.set('key', filterHistory.key);
        search.set('timestamp', filterHistory.timestamp);

        for (var i = 0; i < filterHistory.filters.length; i++) {
            var querry = filterHistory.filters[i];

            // each Querry object is a Filter model
            var filter = this.querryToFilter(querry);
            search.get("filters").add(filter);
        }

        return search;
    },

    /**
     * Translates a edu.mayo.ve.message.Querry object into a Filter model.
     * @param querry
     */
    querryToFilter: function(querry) {
        var filter;

        if (querry.sampleGroups.length == 1) {
            filter = new GroupFilter();

            var sampleGroupPojo = querry.sampleGroups[0];
            var inSample = sampleGroupPojo.inSample;
            if (inSample) {
                filter = MongoApp.FILTER_IN_GROUP.clone();
            } else {
                filter = MongoApp.FILTER_NOT_IN_GROUP.clone();
            }
            filter.set("genotype", filter.toGenotype(sampleGroupPojo.zygosity));
            filter.set("sampleStatus", filter.toSampleStatus(sampleGroupPojo.allAnySample));
            filter.set("value", new SampleGroup().fromPojo(sampleGroupPojo));
        }
        else if (querry.infoFlagFilters.length == 1) {
            filter = new Filter().fromInfoFlagFilterPojo(querry.infoFlagFilters[0]);
        }
        else if (querry.infoNumberFilters.length == 1) {
            filter = new Filter().fromInfoNumberFilterPojo(querry.infoNumberFilters[0]);
        }
        else if (querry.infoStringFilters.length == 1) {
            filter = new Filter().fromInfoStringFilterPojo(querry.infoStringFilters[0]);
        }
        else if (querry.sampleNumberFilters.length == 1) {
            filter = new Filter().fromSampleNumberFilterPojo(querry.sampleNumberFilters[0]);
        }
        else if (querry.customNumberFilters.length == 1) {
            filter = new AltAlleleDepthFilter();
            filter.set("value", querry.customNumberFilters[0].value);
        }

        if (filter != undefined)
            filter.setFilterDisplay();

        return filter;
    }
});