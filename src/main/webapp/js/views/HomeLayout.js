HomeLayout = Backbone.Marionette.Layout.extend({

    template: "#home-layout-template",

    regions: {
        workspaceGroupRegion:  '#workspaceGroupRegion',
        workspaceRegion:  '#workspaceRegion'
    },

    initialize: function() {
    },

    events: {
    },

    onShow: function() {

        MongoApp.workspaceController.showWorkspaceTable({region: this.workspaceRegion });
        MongoApp.workspaceController.showWorkspaceGroupDropdown({region: this.workspaceGroupRegion });

    }
});