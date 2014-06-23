SettingsController = Backbone.Marionette.Controller.extend({

    initialize: function () {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_CHANGE, function (workspace) {
            self.changeWorkspace(workspace);
        });
    },

    changeWorkspace: function(workspace) {
        MongoApp.indexController.initialize(workspace.get("key"), workspace.get("dataFields"));
        MongoApp.indexController.refreshIndexes();
    }

});