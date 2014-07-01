MainHeaderLayout = Backbone.Marionette.Layout.extend({

    /**
     * Fired when the user changes the selected tab
     */
    EVENT_HOME_TAB_SELECTED:     'home_tab_selected',
    EVENT_SETTINGS_TAB_SELECTED: 'settings_tab_selected',
    EVENT_DATA_TAB_SELECTED:     'data_tab_selected',

    template: "#main-header-layout-template",

    /**
     * Delegated events
     */
    events: {
        "click #navbar_tabs a" : "switchTab",

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
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_CHANGE, function () {
            // update navbar to have a new tab for the workspace
            $('#navbar_tab_table a').html('<i class="fa fa-file"></i> ' + MongoApp.workspace.get("alias"));
            $('#navbar_tab_table').toggle(true); // set visible if not already

            // simulate clicking on it
            $('#table_tab').click(); // register click event to switch to that tab
        });
    },

    onShow: function() {
        this.userRegion.show(new MainHeaderUserLayout({
            "model": MongoApp.user
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
        }

        // switch active tab
        var listItem = $(e.target).parent();
        listItem.siblings('li').removeClass('active');
        listItem.addClass('active');
    }
});