SearchNameView = Backbone.Marionette.ItemView.extend({

//    tagName: "tr",

    template: '#search-name-template',

    events: {
        "click .searchNameChange" : "makeNameEditable",
        "click .searchNameApply" : "applySearchName"
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
                    MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_IMPORT, reader.result);
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

    makeNameEditable: function(e) {
        var renameDiv = this.$el.find('#search_rename_div');
        var nameDiv = this.$el.find('#search_name_div');

        renameDiv.toggle(true);
        nameDiv.toggle(false);

        var renameInput = renameDiv.find('input');
        renameInput.val(this.model.get('name'));
        renameInput.focus(); // request focus
        renameInput.select(); // select all text

        var self = this;
        var applyNewName = function() {
            if (renameInput.val().length == 0) {
                // do nothing if no value
                return;
            }

            self.model.set('name', renameInput.val());
            self.model.set("saved", false);
            renameDiv.toggle(false);
            nameDiv.toggle(true);
        }
        var undo = function() {
            renameDiv.toggle(false);
            nameDiv.toggle(true);
        };

        // name is set either by:
        // 1. ENTER key press
        // 2. input field loses focus
        renameInput.keypress(function (e) {
            var charCode = e.charCode || e.keyCode || e.which;
            if (charCode  == 13) { // ENTER
                applyNewName();
                return false;
            }
        });
        renameInput.focusout(function() {
            if (renameInput.is(':visible'))
                applyNewName();
        });
        renameInput.keydown(function (e) {
            if (e.keyCode == 27) { // ESC
                undo();
            }
        });
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
    }

});