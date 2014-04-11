/**
 * Controller for Search related objects.
 * @type {*}
 */
var SearchController = Backbone.Marionette.Controller.extend({

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

        var addFilterDialog = new AddFilterDialog(MongoApp.indexController);
        $('#show_add_filter_dialog_button').click(function (e)
        {
            addFilterDialog.show(MongoApp.workspace);
        });
    },

    showSearchTable: function (options) {

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
    }

});