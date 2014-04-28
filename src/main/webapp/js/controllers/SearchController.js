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
        MongoApp.on("filterAdd", function (filter) {
            self.addFilter(filter);
        });
        MongoApp.on("filterRemove", function (filter) {
            self.removeFilter(filter);
        });
        MongoApp.on("saveSearch", function (search) {
            self.saveSearch(search);
        });
        MongoApp.on("deleteSearch", function (search) {
            self.deleteSearch(search);
        });
        MongoApp.on("configureSearch", function (search) {
            self.configureSearch(search);
        });
        MongoApp.on("exportSearch", function (search) {
            self.exportSearch(search);
        });
        MongoApp.on("importSearch", function (filterHistoryJsonText) {
            self.importSearch(filterHistoryJsonText);
        });

        var addFilterDialog = new AddFilterDialog(MongoApp.indexController);
        $('#show_add_filter_dialog_button').click(function (e)
        {
            addFilterDialog.show(MongoApp.workspace);
        });
    },

    showSearchName: function(options) {
        this.searchNameView = new SearchNameView({model: MongoApp.search});

        options.region.show(this.searchNameView);
    },

    showSearchTable: function (options) {

        var searchTableView = new SearchTableView({
            collection: this.searches
        });

        options.region.show(searchTableView);
    },

    showSearchFilterTable: function (options) {
        this.searchFilterView = new SearchFilterTableView({
            collection: MongoApp.search.get("filters")
        });
        options.region.show(this.searchFilterView);
    },

    addFilter: function (filter) {
        MongoApp.search.get("filters").add(filter);

        if (filter.get('id') != MongoApp.FILTER_NONE.get('id'))
            MongoApp.search.set("saved", false);

        MongoApp.trigger("searchFilterAdded", MongoApp.search);
        this.updateFilterRemovable();
    },

    removeFilter: function (filter) {
        MongoApp.search.get("filters").remove(filter);
        MongoApp.search.set("saved", false);
        MongoApp.trigger("searchFilterRemoved", MongoApp.search);
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

        var filterHistory = this.searchToFilterHistory(search);

        var self = this;
        $.ajax({
            type: "POST",
            url: "/mongo_svr/ve/filterHistory/save",
            contentType: "application/json",
            data: JSON.stringify(filterHistory),
            dataType: "json",
            success: function(json)
            {
                var savedSearch = self.filterHistoryToSearch(json);
                MongoApp.trigger(MongoApp.events.SEARCH_LOAD, savedSearch);
                console.log("save successful!");
            },
            error: function(jqXHR, textStatus) {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
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
                    MongoApp.trigger("workspaceLoad", MongoApp.workspace);
                }
            },
            error: function(jqXHR, textStatus) {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
    },

    /**
     * Refreshes the Backbone collection of searches by querying the server.
     */
    refreshSearches: function(workspace) {

        console.log("refreshing searches for workspace");

        var self = this;

        // clear out workspaces
        this.searches.reset();

        // get workspace information from server
        $.ajax({
            url: "/mongo_svr/ve/filterHistory/search/w/" + workspace.get("key"),
            dataType: "json",
            success: function(json) {

                var filterHistories = json.filterHistories;
                for (var i = 0; i < filterHistories.length; i++) {
                    var search = self.filterHistoryToSearch(filterHistories[i]);
                    self.searches.add(search);
                }
            },
            error: function(jqXHR, textStatus) {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
    },

    /**
     * Show configure search dialog
     * @param search
     */
    configureSearch: function(search) {

        this.refreshSearches(MongoApp.workspace);

        $('#searches_modal').modal();
    },

    /**
     * Import Search model from a file on client.
     * @param JSON text for filter history javascript object.
     */
    importSearch: function(filterHistoryJsonText) {
        var filterHistory = JSON.parse(filterHistoryJsonText);
        var search = this.filterHistoryToSearch(filterHistory);
        MongoApp.trigger(MongoApp.events.SEARCH_LOAD, search);
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
        filterHistory.id      = search.get("id");
        filterHistory.name    = search.get("name");
        filterHistory.user    = search.get("user");
        filterHistory.key     = search.get("key");
        filterHistory.filters = new Array();

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
            filter = new Filter();

            var sampleGroup = querry.sampleGroups[0];
            var inSample = sampleGroup.inSample;
            if (inSample) {
                filter = MongoApp.FILTER_IN_GROUP.clone();
            } else {
                filter = MongoApp.FILTER_NOT_IN_GROUP.clone();
            }
            filter.set("value", sampleGroup.alias);
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

        if (filter != undefined)
            filter.setFilterDisplay();

        return filter;
    }
});