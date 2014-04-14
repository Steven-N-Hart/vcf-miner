SearchNameView = Backbone.Marionette.ItemView.extend({

//    tagName: "tr",

    template: '#search-name-template',

    events: {
        "click .searchNameChange" : "showNameChangePopover",
        "click .searchNameApply" : "applySearchName",
        "click .searchSave" : "saveSearch",
        "click .searchConfigure" : "configureSearch"
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

    showNameChangePopover: function(e) {
        var anchor = this.$el.find('.searchName');

        anchor.popover('destroy');

        var templateData = {
            name: this.model.get("name")
        };

        anchor.popover({
            trigger: 'manual',
            placement: 'bottom',
            html: true,
            content: _.template($("#search-name-change-popover-template").html(), templateData)
        });

//        // ENTER key press causes "Apply" button click
//        popoverParentContainer.find('input').keypress(function (e) {
//            var charCode = e.charCode || e.keyCode || e.which;
//            if (charCode  == 13) {
//
//                $('#apply_search_name').click();
//
//                return false;
//            }
//        });

        anchor.popover('show');
    },

    /**
     * Applies the user entered search name to the model.
     * @param e
     */
    applySearchName: function(e) {
        var textInput = this.$el.find('input');
        this.model.set("name", textInput.val());

        var anchor = this.$el.find('.searchNameChange');
        anchor.popover('destroy');
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    saveSearch: function(e) {
        MongoApp.trigger("saveSearch", MongoApp.search);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    configureSearch: function(e) {
        MongoApp.trigger("configureSearch", MongoApp.search);
    }
});