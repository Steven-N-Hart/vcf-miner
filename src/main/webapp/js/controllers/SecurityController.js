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
            success: function(authResponse) {
                if (authResponse.isAuthenticated) {
                    console.log("login successful");
                    self.initUser(authResponse.userToken, username);
                } else {
                    console.log("login failed");
                    MongoApp.dispatcher.trigger(MongoApp.events.LOGIN_FAILED);
                }
            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    },

    initUser: function(userToken, username) {

        var user = this.getUser(userToken, username);

        // get user's current groups
        var groups = this.getGroupsForLoggedInUser(userToken);

        // determine if the SOLO group exists already
        var soloGroupName = this.getSoloGroupName(user);
        var soloGroup = groups.findWhere({groupName: soloGroupName});

        // setup SOLO group if necessary
        if (soloGroup == undefined) {
            soloGroup = this.createGroup(userToken, soloGroupName);
            if (soloGroup != null) {
                this.addUserToGroup(userToken, soloGroupName, username);
            }
        }

        // delegate further action by firing a LOGIN_SUCCESS event.
        MongoApp.dispatcher.trigger(MongoApp.events.LOGIN_SUCCESS, user);
    },

    /**
     * Gets the "solo" group name.  The "solo" group is a special internal
     * group that contains 1 and only 1 user, the user itself that created
     * the group.  The name follows a convention based on this function's
     * implementation.
     *
     * @param user
     */
    getSoloGroupName: function(user) {
        return user.get('username') + '.solo.group';
    },

    /**
     * Fetches information about the user, initializes the Backbone model
     *
     * NOTE: This function is synchronous.
     *
     * @param username
     * @param userToken
     */
    getUser: function(userToken, username) {

        var user=null;

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/users/" + username,
            headers: {usertoken: userToken},
            data: {},
            dataType: "json",
            async: false,
            success: function(json) {
                // init Backbone model
                user = new User(json);
            },
            error: function(jqXHR ) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });

        // add the authentication token
        user.set("token", userToken);

        return user;
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
            success: function() {
                console.log("logout successful");
                MongoApp.dispatcher.trigger(MongoApp.events.LOGOUT_SUCCESS);
            },
            error: function(jqXHR) {
                console.log("logout failed");
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    },

    /**
     * Fetches the groups for the user that is currently signed into the system.
     *
     * NOTE: this call is synchronous
     */
    getGroupsForLoggedInUser: function(userToken) {

        var groups = new UserGroupList();

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/groups/forme",
            headers: {usertoken: userToken},
            dataType: "json",
            async: false,
            success: function(groupArray) {

                for (var i = 0; i < groupArray.length; i++) {
                    // init Backbone model
                    var group = new UserGroup(groupArray[i]);

                    groups.add(group);
                }

            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });

        return groups;
    },

    /**
     * Creates a new group on the server.
     *
     * NOTE: this call is synchronous
     *
     * @returns A new UserGroup backbone model on success.  NULL on failure.
     */
    createGroup: function(userToken, groupName) {

        var group=null;

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/groups/add",
            headers: {usertoken: userToken},
            data: {groupname: groupName},
            dataType: "json",
            async: false,
            success: function(groupJSON) {
                console.debug("Created new group " + groupName);
                group = new UserGroup(groupJSON);

            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });

        return group;
    },

    /**
     * Creates a new group on the server.
     *
     * NOTE: this call is synchronous
     */
    addUserToGroup: function(userToken, groupName, userName) {

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/groups/addusertogroup",
            headers: {usertoken: userToken},
            data: {groupname: groupName, username: userName},
            dataType: "json",
            async: false,
            success: function() {
                console.debug("Added user " + userName + " to " + groupName);
            },
            error: function(jqXHR) {
                MongoApp.dispatcher.trigger(MongoApp.events.ERROR, jqXHR.responseText);
            }
        });
    }

});
