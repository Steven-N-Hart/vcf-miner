SearchTableRowView = Backbone.Marionette.ItemView.extend({

    tagName: "tr",

    template: '#search-row-template',

    events: {
        "click .open" : "openSearch"
    },

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options) {
        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, 'change', this.render);
    },

    openSearch: function() {

        MongoApp.showPleaseWait();

        var self = this;
        setTimeout(function(){MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_LOAD, self.model);}, 0);

        $('#searches_modal').modal('hide');
    }

});