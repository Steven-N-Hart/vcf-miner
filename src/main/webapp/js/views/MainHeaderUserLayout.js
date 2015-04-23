MainHeaderUserLayout = Backbone.Marionette.Layout.extend({

    template: "#main-header-user-layout-template",

    events: {
        "click .logout" : "logout"
    },

    onShow: function() {
    },

    onClose: function() {
    },

    logout: function() {
        MongoApp.dispatcher.trigger(MongoApp.events.LOGOUT, MongoApp.securityController.user.get("token"));
    }
});