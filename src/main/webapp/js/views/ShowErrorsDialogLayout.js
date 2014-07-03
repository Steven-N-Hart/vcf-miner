ShowErrorsDialogLayout = Backbone.Marionette.Layout.extend({

    template: "#show-errors-dialog-layout-template",

    regions: {},

    ui: {
        numLinesField: "input",
        previewTextArea: "textarea"
    },

    events: {
        "change input": "updatePreview",
        "click .download": "download"
    },

    onShow: function() {
        // show modal dialog
        this.$el.parents('.modal').modal();

        this.updatePreview();
    },

    onClose: function() {
        this.$el.parents('.modal').modal('hide');
    },

    /**
     * Updates the preview textarea widget based on the user's preferred number of lines set.
     */
    updatePreview: function() {

        var numLines = this.ui.numLinesField.val();

        // TODO: perform AJAX HTTP GET to server to get content
        var content = 'Preview of the first ' + numLines + ' lines from ' + this.model.get("alias");

        this.ui.previewTextArea.text(content);
    },

    /**
     * Download entire error log to filesystem.
     */
    download: function() {
        // TODO: perform AJAX HTTP call to get entire file
    }
});