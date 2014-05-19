SearchSaveView = Backbone.Marionette.ItemView.extend({

    template: '#search-save-template',

    events: {
        "click .searchSave" : "saveSearch"
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
        var self = this;

        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, 'change', this.render);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    saveSearch: function(e) {
        MongoApp.vent.trigger(MongoApp.events.SEARCH_SAVE, MongoApp.search);
    }

});