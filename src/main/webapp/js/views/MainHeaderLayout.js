MainHeaderLayout = Backbone.Marionette.Layout.extend({

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

    initialize: function(options) {

        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_META_LOADED, function () {
            // update navbar to have a new tab for the workspace
            $('#navbar_tab_table a').html('<i class="fa fa-file"></i> ' + MongoApp.workspace.get("alias"));
            $('#navbar_tab_table').toggle(true); // set visible if not already

            // simulate clicking on it
            $('#table_tab').click(); // register click event to switch to that tab
        });
    },

    switchHomeTab: function() {

        this.$('#home_tab').click();

    },

    switchTab: function(e) {

        switch(e.target.id)
        {
            case 'home_tab':
                $("#getting_started").toggle(true);
                $("#jquery-ui-container").toggle(false);
                $("#settings").toggle(false);
                break;
            case 'settings_tab':
                $("#getting_started").toggle(false);
                $("#jquery-ui-container").toggle(false);
                $("#settings").toggle(true);
                break;
            case 'table_tab':
                $("#getting_started").toggle(false);
                $("#jquery-ui-container").toggle(true);
                $("#settings").toggle(false);
                break;
        }

        // switch active tab
        var listItem = $(e.target).parent();
        listItem.siblings('li').removeClass('active');
        listItem.addClass('active');
    },

    logout: function() {
        MongoApp.dispatcher.trigger(MongoApp.events.LOGOUT, MongoApp.user.get("token"));
    }

});