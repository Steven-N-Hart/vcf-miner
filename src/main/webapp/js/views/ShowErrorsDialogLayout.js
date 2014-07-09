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

        var key = this.model.get("key");

        var self = this;
        $.ajax({
            url: "/mongo_svr/error/download/w/"+key+"/n/"+numLines,
            dataType: "text",
            success: function(lines) {
                // TODO: perform AJAX HTTP GET to server to get content
//                var content = 'Preview of the first ' + numLines + ' lines from ' + this.model.get("alias");
                self.ui.previewTextArea.text(lines);
            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    },

    /**
     * Download entire error log to filesystem.
     */
    download: function() {
        var errorAndWarningCount = this.model.get("statsErrors") + this.model.get("statsWarnings");

        var url="/mongo_svr/error/download/w/"+this.model.get("key")+"/n/"+errorAndWarningCount;

        window.open(url,'_blank');
    }
});