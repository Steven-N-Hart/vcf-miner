SearchNameView = Backbone.Marionette.ItemView.extend({

//    tagName: "tr",

    template: '#search-name-template',

    events: {
        "click .searchNameChange" : "showNameChangePopover",
        "click .searchNameApply" : "applySearchName",
        "click .searchSave" : "saveSearch",
        "click .searchDelete" : "deleteSearch",
        "click .searchConfigure" : "configureSearch",
        "click .searchExport" : "exportSearch",
        "click .searchImport" : "importSearch"
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

        // jQuery validate plugin config
        $('#import_search_form').validate( {
            rules: {
                search_file_upload: {
                    required: true,
                    minlength: 1
                }
            },
            submitHandler: function(form) {
                var files = $('input#search_file_upload')[0].files;
                var reader = new FileReader();

                reader.onload = function(e) {
                    MongoApp.trigger("importSearch", reader.result);
                    $('#import_search_modal').modal('hide')
                }
                // async call
                reader.readAsText(files[0]);
            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        });

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
        this.model.set("saved", false);

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
    deleteSearch: function(e) {
        var self = this;
        var confirmDialog = new ConfirmDialog(
            "Delete Search",
            "Delete " + self.model.get("name")  + "?",
            "Delete",
            function()
            {
                // confirm
                MongoApp.trigger("deleteSearch", self.model);
            }
        );
        confirmDialog.show();
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    configureSearch: function(e) {
        MongoApp.trigger("configureSearch", MongoApp.search);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    exportSearch: function(e) {
        MongoApp.trigger("exportSearch", MongoApp.search);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    importSearch: function(e) {
        $('#import_search_modal').modal();
    }
});