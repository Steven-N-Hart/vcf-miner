SettingsController = Backbone.Marionette.Controller.extend({

    initialize: function () {

        var self = this;

        // Wire events to functions
        MongoApp.vent.on(MongoApp.events.WKSP_CHANGE, function (workspace) {
            self.changeWorkspace(workspace);
        });
    },

    showSettingsTab: function (options) {

        var settingsTabLayout = new SettingsTabLayout();
        options.region.show(settingsTabLayout);
    },

    changeWorkspace: function(workspace) {
        MongoApp.indexController.initialize(workspace.get("key"), workspace.get("dataFields"));
        MongoApp.indexController.refreshIndexes();
    }

});