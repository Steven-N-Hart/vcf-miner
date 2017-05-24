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

        MongoApp.workspaceController.showWorkspaceTable({regionTable: this.workspaceRegion, regionGroup: this.workspaceGroupRegion });

    }
});