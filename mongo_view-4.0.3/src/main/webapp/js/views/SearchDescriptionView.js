SearchDescriptionView = Backbone.Marionette.ItemView.extend({

    template: '#search-description-template',

    events: {
        "click .searchDescriptionChange" : "showDescriptionEditDialog"
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

    showDescriptionEditDialog: function(e) {

        var search = this.model;

        var saveCallback = function() {
            search.set("description", $('#search_save_desc_field').val());
            search.set("saved", false);
        };

        var cancelCallback = function() {};

        var wysihtml5Initialized = false;
        var shownCallback = function(okButton, cancelButton) {

            // by default, set the current description
            $('#search_save_desc_field').val(search.get("description"));

            if (wysihtml5Initialized == false) {
                $('#search_save_desc_field').wysihtml5({stylesheets:[]});
                wysihtml5Initialized = true;
            }
        };

        var html =
            '<div class="row-fluid">' +
                '<div class="span12">'+
                    '<textarea id="search_save_desc_field" name="search_save_desc_field" class="textarea span12" rows="5"></textarea>'+
                '</div>'+
            '</div>';

        var confirmDialog = new ConfirmDialog("Edit Description", html, "Apply", saveCallback, cancelCallback, shownCallback);
        confirmDialog.show();
    }
});