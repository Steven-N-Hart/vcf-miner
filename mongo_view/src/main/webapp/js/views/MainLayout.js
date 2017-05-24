MainLayout = Backbone.Marionette.Layout.extend({

    template: "#main-layout-template",

    regions: {
        mainHeaderRegion:  '#mainHeaderRegion',
        homeRegion:        '#homeRegion',
        settingsRegion:    '#settingsRegion',
        dataRegion:        '#dataRegion',
        userRegion:        '#userRegion'
    },

    initialize: function() {
    },

    onShow: function() {
        var mainHeaderLayout = new MainHeaderLayout();
        this.mainHeaderRegion.show(mainHeaderLayout);

        this.homeRegion.show(new HomeLayout());
        this.settingsRegion.show(new SettingsLayout());
        this.dataRegion.show(new DataLayout());
        this.userRegion.show(new UserInformationLayout({model: MongoApp.securityController.user}));

        var self = this;
        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_HOME_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(true);
            self.settingsRegion.$el.toggle(false);
            self.dataRegion.$el.toggle(false);
            self.userRegion.$el.toggle(false);
        });

        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_SETTINGS_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(false);
            self.settingsRegion.$el.toggle(true);
            self.dataRegion.$el.toggle(false);
            self.userRegion.$el.toggle(false);
        });

        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_DATA_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(false);
            self.settingsRegion.$el.toggle(false);
            self.dataRegion.$el.toggle(true);
            self.userRegion.$el.toggle(false);
        });

        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_USER_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(false);
            self.settingsRegion.$el.toggle(false);
            self.dataRegion.$el.toggle(false);
            self.userRegion.$el.toggle(true);
        });

        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_COMPLETE, function () {
            $(window).trigger('resize');
//            // manually invoke jQUery UI layout resizeAll to get the overflow scrollbars working
//            self.jqueryUiLayout.resizeAll();
        });

        this.initJqueryUI();

        // have the HOME tab shown by default
        mainHeaderLayout.switchHomeTab();
    },

    /**
     * Setup the jquery ui layout
     */
    initJqueryUI: function() {

        var self = this;

        var container = this.$el.find('.jquery-ui-container-div');
        this.jqueryUiLayout = container.layout({
            //	reference only - these options are NOT required because 'true' is the default
            closable: true
            ,	resizable: false
            ,	slidable: false
            ,	livePaneResizing: false
            ,	north__showOverflowOnHover:	true
        });

        // listen for browser window resize events
        // this is a fix for Firefox not working correctly with the jQuery UI Layout auto-resizing.
        $( window ).resize(function() {
            self.jqueryUiLayout.resizeAll();
        });
    }

});