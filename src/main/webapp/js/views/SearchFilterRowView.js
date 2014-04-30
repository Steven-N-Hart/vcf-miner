SearchFilterRowView = Backbone.Marionette.ItemView.extend({

    tagName: "tr",

    template: '#search-filter-row-template',

    events: {
        "click .remove" : "removeFilter"
    },

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options)
    {
        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, 'change', this.render);
    },

    removeFilter: function(e) {
        MongoApp.vent.trigger(MongoApp.events.SEARCH_FILTER_REMOVE, this.model);
    }
});