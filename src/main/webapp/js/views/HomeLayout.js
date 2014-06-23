HomeLayout = Backbone.Marionette.Layout.extend({

    template: "#home-layout-template",

    regions: {
        workspaceRegion:  '#workspaceRegion'
    },

    initialize: function() {
    },

    events: {
    },

    onShow: function() {

        MongoApp.workspaceController.showWorkspaceTable({region: this.workspaceRegion });

    }

});