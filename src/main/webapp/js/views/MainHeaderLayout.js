MainHeaderLayout = Backbone.Marionette.Layout.extend({

    /**
     * Fired when the user changes the selected tab
     */
    EVENT_HOME_TAB_SELECTED:     'home_tab_selected',
    EVENT_SETTINGS_TAB_SELECTED: 'settings_tab_selected',
    EVENT_DATA_TAB_SELECTED:     'data_tab_selected',
    EVENT_USER_TAB_SELECTED:     'user_tab_selected',

    template: "#main-header-layout-template",

    /**
     * Delegated events
     */
    events: {
        "click .navbar a" : "switchTab",

        // clicking on brand is redirected to a click on home tab
        "click .navbar .brand" : "switchHomeTab",

        "click .logout" : "logout"
    },

    regions: {
        userRegion: '#mainHeaderUserRegion'
    },

    initialize: function(options) {

        var self = this;
//        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_META_LOADED, function () {
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_CHANGE, function (workspaceKey) {
            var workspace = MongoApp.workspaceController.getWorkspace(workspaceKey);

            // update navbar to have a new tab for the workspaceKey
            $('#navbar_tab_table a').html('<i class="fa fa-file"></i> ' + workspace.get("alias"));
            $('#navbar_tab_table').toggle(true); // set visible if not already
            $('#navbar_tab_advanced').toggle(true);

            // simulate clicking on it
            $('#table_tab').click(); // register click event to switch to that tab
        });

        MongoApp.dispatcher.on(MongoApp.events.WKSP_CLOSE, function() {

            // hide the tab
            $('#navbar_tab_table').toggle(false);
            $('#navbar_tab_advanced').toggle(false);

            // switch back to home tab
            self.switchHomeTab();
        });
    },

    onShow: function() {
        this.userRegion.show(new MainHeaderUserLayout({
            "model": MongoApp.securityController.user
        }));

        this.switchHomeTab();
    },

    switchHomeTab: function() {

        this.$('#home_tab').click();

    },

    switchTab: function(e) {

        switch(e.target.id)
        {
            case 'home_tab':
                this.trigger(this.EVENT_HOME_TAB_SELECTED);
                break;
            case 'settings_tab':
                this.trigger(this.EVENT_SETTINGS_TAB_SELECTED);
                break;
            case 'table_tab':
                this.trigger(this.EVENT_DATA_TAB_SELECTED);
                break;
            case 'user_tab':
                this.trigger(this.EVENT_USER_TAB_SELECTED);
                break;
        }

        // switch active tab
        var listItem = $(e.target).parent();
        this.$el.find('li').removeClass('active');
        listItem.addClass('active');
    }
});