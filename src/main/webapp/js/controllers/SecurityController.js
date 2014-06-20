SecurityController = Backbone.Marionette.Controller.extend({

    initialize: function () {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.LOGIN, function (username, password) {
            self.login(username, password);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.LOGOUT, function (userToken) {
            self.logout(userToken);
        });
    },

    showLogin: function(options) {
        this.loginLayout = new LoginLayout();
        options.region.show(this.loginLayout);
    },

    /**
     * Authenticates the user
     *
     * @param username
     * @param password
     */
    login: function(username, password) {

        var self = this;

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/login",
            data: {username: username, password: password, appkey: 'VcfMiner'},
            dataType: "json",
            success: function(json) {
                switch (json.Status) {
                    case 'OK':
                        console.log("login successful");
                        self.initUser(username, json.UserToken);
                        break;
                    default:
                        console.log("login failed");
                        MongoApp.dispatcher.trigger(MongoApp.events.LOGIN_FAILED);
                }
            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    },

    /**
     * Fetches information about the user, initializes the Backbone model, and
     * delegates further action by firing a LOGIN_SUCCESS event.
     *
     * @param username
     * @param userToken
     */
    initUser: function(username, userToken) {

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/users/" + username,
            headers: {usertoken: userToken},
            data: {},
            dataType: "json",
            success: function(json) {

                // init Backbone model
                var user = new User(json.User);

                // add the authentication token
                user.set("token", userToken);

                MongoApp.dispatcher.trigger(MongoApp.events.LOGIN_SUCCESS, user);
            },
            error: function(jqXHR ) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    },

    /**
     * Logs out the user
     *
     * @param userToken
     */
    logout: function(userToken) {

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/logout",
            headers: {usertoken: userToken},
            data: {},
            dataType: "json",
            success: function(json) {
                switch (json.Status) {
                    case 'OK':
                        console.log("logout successful");
                        MongoApp.dispatcher.trigger(MongoApp.events.LOGOUT_SUCCESS);

                        break;
                    default:
                        console.log("logout failed");
                }
            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    }

});
