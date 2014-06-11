LoginLayout = Backbone.Marionette.Layout.extend({
    template: "#login-layout-template",

    /**
     * Delegated events
     */
    events:
    {
        "click .login" : "login"
    },

    login: function() {

        var username = $("#login_username_field").val();
        var password = $("#login_password_field").val();

        MongoApp.vent.trigger(MongoApp.events.LOGIN, username, password);
    }
});