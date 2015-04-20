SearchSaveView = Backbone.Marionette.ItemView.extend({

    template: '#search-save-template',

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
    }

});