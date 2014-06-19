LoginLayout = Backbone.Marionette.Layout.extend({
    template: "#login-layout-template",

    /**
     * Delegated events
     */
    events:
    {
        "click .login" : "login"
    },

    onShow: function() {
        var usernameField = this.$el.find('#login_username_field');
        usernameField.focus(); // request focus
    },

    login: function() {

        var username = $("#login_username_field").val();
        var password = $("#login_password_field").val();

        MongoApp.dispatcher.trigger(MongoApp.events.LOGIN, username, password);
    }
});