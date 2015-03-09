SettingsController = Backbone.Marionette.Controller.extend({

    initialize: function () {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_CHANGE, function (workspaceKey) {
            self.changeWorkspace(workspaceKey);
        });
    },

    changeWorkspace: function(workspaceKey) {
        var ws = MongoApp.workspaceController.getWorkspace(workspaceKey);

        MongoApp.indexController.initialize(workspaceKey, ws.get("dataFields"));
        MongoApp.indexController.refreshIndexes();
    }

});