/**
 * Controller for Search related objects.
 * @type {*}
 */
var SearchController = Backbone.Marionette.Controller.extend({

    /**
     * Backbone collection of Workspace models.
     */
    searches: new SearchList(),

    FILTER_NONE: new Filter({name: 'none', displayName: 'none', operator: FilterOperator.UNKNOWN, displayOperator: '',  value: '' , displayValue: '', id:'id-none'}),

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
        MongoApp.on("configureSearch", function (search) {
            self.configureSearch(search);
        });

        var addFilterDialog = new AddFilterDialog(MongoApp.indexController);
        $('#show_add_filter_dialog_button').click(function (e)
        {
            addFilterDialog.show(MongoApp.workspace);
        });
    },

    showSearchName: function(options) {

        var searchNameView = new SearchNameView({
            model: MongoApp.search
        });

        options.region.show(searchNameView);
    },

    showSearchTable: function (options) {

        var searchTableView = new SearchTableView({
            collection: this.searches
        });

        options.region.show(searchTableView);
    },

    showSearchFilterTable: function (options) {

        var searchFilterView = new SearchFilterTableView({
            collection: MongoApp.search.get("filters")
        });

        options.region.show(searchFilterView);
    },

    addFilter: function (filter) {
        MongoApp.search.get("filters").add(filter);
        MongoApp.trigger("searchChanged", MongoApp.search);
        this.updateFilterRemovable();
    },

    removeFilter: function (filter) {
        MongoApp.search.get("filters").remove(filter);
        MongoApp.trigger("searchChanged", MongoApp.search);
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
            if ((filter.get("id") != self.FILTER_NONE.get("id")) &&
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

        $.ajax({
            type: "POST",
            url: "/mongo_svr/ve/filterHistory/save",
            contentType: "application/json",
            data: JSON.stringify(filterHistory),
            dataType: "json",
            success: function(json)
            {
                // TODO: give user feedback
                console.log("save successful!");
            },
            error: function(jqXHR, textStatus) {
                MongoApp.trigger("error", JSON.stringify(jqXHR));
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
                MongoApp.trigger("error", JSON.stringify(jqXHR));
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
     * Translates a Search model into a edu.mayo.ve.message.FilterHistory object.
     * @param filterHistory
     */
    searchToFilterHistory: function(search) {
        var filterHistory = {
            name: search.get("name"),
            user: search.get("user"),
            key:  search.get("key"),
            filters: new Array()
        };

        var self = this;

        // translate Filter model to Querry object (except for NONE filter)
        _.each(search.get("filters").models, function(filter) {

            if (filter.get("id") != "id-none") {
                var filterList = new FilterList();
                filterList.add(filter);

                var querry = buildQuery(filterList, search.get("key"));

                filterHistory.filters.push(querry);
            }

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
        search.set('key', filterHistory.user);
        search.set('timestamp', filterHistory.timestamp);

        if (filterHistory.filters != undefined) {
            for (var i = 0; i < filterHistory.filters.length; i++) {
                var querry = filterHistory.filters[i];

                // each Querry object is a Filter model
                var filter = this.querryToFilter(querry);
                search.get("filters").add(filter);
            }
        }

        return search;
    },

    /**
     * Translates a edu.mayo.ve.message.Querry object into a Filter model.
     * @param querry
     */
    querryToFilter: function(querry) {
        var filter = new Filter();

        var name;
        var description;
        var value;
        var category;

        if (querry.sampleGroups.length == 1) {
            var sampleGroup = sampleGroups[0];
            var value = sampleGroup.alias;
            var inSample = querry.sampleGroups.inSample;
            if (inSample) {
                category = FilterCategory.IN_GROUP;
            } else {
                category = FilterCategory.NOT_IN_GROUP;
            }
        }

        if (querry.infoFlagFilters.length == 1) {
            var infoFlagFilter = querry.infoFlagFilters[0];
            var name = infoFlagFilter.key; // TODO: chomp off INFO.
            var value = infoFlagFilter.value;
            category = FilterCategory.INFO_FLAG;
        }

        if (querry.infoStringFilters.length == 1) {
            var infoFlagFilter = querry.infoFlagFilters[0];
            var name = infoFlagFilter.key; // TODO: chomp off INFO.
            var value = infoFlagFilter.value;
            category = FilterCategory.INFO_FLAG;
        }

        // TODO: finish

        filter.set("name", name);
        filter.set("description", description);
        filter.set("value", value);
        filter.set("category", category);

        return filter;
    }
});