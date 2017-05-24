LoginLayout = Backbone.Marionette.Layout.extend({

    template: "#login-layout-template",

    events: {
        "click .login" : "login"
    },

    ui: {
        usernameField: "#login_username_field",
        passwordField: "#login_password_field"
    },

    regions: {
        messageRegion: '#loginMessageRegion'
    },

    initialize: function() {
        var self = this;

        this.failedAlert = Backbone.Marionette.Layout.extend({
            template: "#login-failed-layout-template"
        });

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.LOGIN_FAILED, function () {

            self.messageRegion.show(new self.failedAlert());

            self.ui.usernameField.val(''); // clear out password field
            self.ui.passwordField.val(''); // clear out password field
            self.ui.usernameField.focus(); // request focus
        });
    },

    onShow: function() {
        this.ui.usernameField.focus(); // request focus
    },

    login: function() {

        var username = this.ui.usernameField.val();
        var password = this.ui.passwordField.val();

        this.messageRegion.reset();

        MongoApp.dispatcher.trigger(MongoApp.events.LOGIN, username, password);
    }
});