// ENUM
var SessionStatus = {
    VALID:    1,
    INVALID:  2,
    EXPIRED:  3
}

SecurityController = Backbone.Marionette.Controller.extend({

    user: new User(),
    userGroups: new UserGroupList(),

    reset: function() {
        this.user = new User();
        this.userGroups.reset();
    },

    initialize: function () {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.LOGIN, function (username, password) {
            self.login(username, password);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.LOGOUT, function (userToken) {
            self.removeFromLocalStorage();
            self.logout(userToken);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SESSION_EXPIRED, function (userToken) {
            self.removeFromLocalStorage();
        });

        // attempt to restore from browser's local storage
        this.restoreFromLocalStorage();
    },

    saveToLocalStorage: function() {
        // store to local browser storage
        localStorage.setItem('cached-user-model', JSON.stringify(this.user));
        localStorage.setItem('cached-user-groups-collection', JSON.stringify(this.userGroups));
    },

    removeFromLocalStorage: function() {
        // delete user model from local browser storage
        localStorage.removeItem('cached-user-model');
        localStorage.removeItem('cached-user-groups-collection');
    },

    restoreFromLocalStorage: function() {
        // attempt to load user model from local browser storage
        var userJsonString   = localStorage.getItem('cached-user-model');
        var groupsJsonString = localStorage.getItem('cached-user-groups-collection');
        if ((userJsonString != undefined) && (groupsJsonString != undefined)) {
            var user = new User(JSON.parse(userJsonString));
            var userGroups = new UserGroupList(JSON.parse(groupsJsonString));

            this.user.set(user.attributes);
            this.userGroups.add(userGroups.models);
        }
    },

    /**
     * Checks the status of the current session.
     *
     * @returns {number} Returns a {#SessionStatus}.
     */
    getSessionStatus: function() {

        // if we don't have a token at all, it's INVALID
        if (!this.user.has("token")) {
            return SessionStatus.INVALID;
        }

        var userToken = this.user.get("token");
        try {
            // check if user's session still valid with arbitrary AJAX call
            // AJAX call will throw an exception if session is not valid
            this.getGroupsForLoggedInUser(userToken);

            // AJAX call was successful, session is still valid
            return SessionStatus.VALID;

        } catch (e) {

            return SessionStatus.EXPIRED;
        }
    },

    showLogin: function(options) {
        this.loginLayout = new LoginLayout();
        options.region.show(this.loginLayout);
    },

    /**
     * Authenticates the user and initializes stuff in the UserSecurityApp upon successful authentication.
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

                    console.log("usertoken: " + authResponse.userToken);

                    try {
                        var user = self.initUser(authResponse.userToken, username);
                        var userGroups = self.getGroupsForLoggedInUser(authResponse.userToken);

                        self.user.set(user.attributes);
                        self.userGroups.add(userGroups.models);

                        self.saveToLocalStorage();

                        // delegate further action by firing a LOGIN_SUCCESS event.
                        console.log("login successful");
                        MongoApp.dispatcher.trigger(MongoApp.events.LOGIN_SUCCESS, user, userGroups);

                    } catch (exception) {
                        if (exception instanceof AJAXRequestException) {
                            console.log("user initialization failed");
                            jqueryAJAXErrorHandler(exception.jqXHR, exception.textStatus, exception.errorThrown);
                        }
                    }

                } else {
                    console.log("login failed");
                    MongoApp.dispatcher.trigger(MongoApp.events.LOGIN_FAILED);
                }
            },
            error: jqueryAJAXErrorHandler
        });
    },

    /**
     * Initializes the user in the UserSecurityApp backend web application.
     *
     * @param userToken
     * @param username
     *
     * @return
     *      An initialized {@link User} backbone model.
     *
     * @throws AJAXRequestException
     */
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

        return user;
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
     * @param userToken
     * @param username
     * @throws AJAXRequestException
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
            error: function(jqXHR, textStatus, errorThrown) {
                throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
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
            error: jqueryAJAXErrorHandler
        });
    },

    /**
     * Gets a {@link UserGroupList} backbone collection for the user that is currently signed into the system.
     *
     * NOTE: this call is synchronous
     *
     * @param userToken
     *
     * @returns TODO
     *
     * @throws AJAXRequestException
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
            error: function(jqXHR, textStatus, errorThrown) {
                throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
            }
        });

        return groups;
    },

    /**
     * Creates a new group on the server.
     *
     * NOTE: this call is synchronous
     *
     * @returns A new UserGroup backbone model on success.
     *
     * @throws AJAXRequestException
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
            error: function(jqXHR, textStatus, errorThrown) {
                throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
            }
        });

        return group;
    },

    /**
     * Adds the given user to the group.
     *
     * NOTE: this call is synchronous
     *
     * @throws AJAXRequestException
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
            error: function(jqXHR, textStatus, errorThrown) {
                throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
            }
        });
    },

    /**
     * Gets workspace keys authorized to the specified group.
     *
     * @param userGroup
     *
     * @return
     *      An {@link Array} of strings, each string representing a workspace key.
     *
     * @throws AJAXRequestException
     */
    getAuthorizedWorkspaceKeys: function(userToken, userGroup) {

        var workspaceKeys = new Array();

        $.ajax({
            type: "POST",
            url: "/securityuserapp/api/resources/forgroup",
            headers: {usertoken: userToken},
            data: {groupname: userGroup.get("groupName")},
            dataType: "json",
            async: false,
            success: function(permissions) {
                for (var i = 0; i < permissions.length; i++) {
                    workspaceKeys.push(permissions[i].key);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
            }
        });

        return workspaceKeys;
    }
});
