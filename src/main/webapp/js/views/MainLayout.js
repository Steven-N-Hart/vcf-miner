MainLayout = Backbone.Marionette.Layout.extend({

    template: "#main-layout-template",

    regions: {
        mainHeaderRegion:  '#mainHeaderRegion',
        homeRegion:        '#homeRegion',
        settingsRegion:    '#settingsRegion',
        dataRegion:        '#dataRegion'
    },

    initialize: function() {
    },

    onShow: function() {
        var mainHeaderLayout = new MainHeaderLayout();
        this.mainHeaderRegion.show(mainHeaderLayout);

        this.homeRegion.show(new HomeLayout());
        this.settingsRegion.show(new SettingsLayout());
        this.dataRegion.show(new DataLayout());

        var self = this;
        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_HOME_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(true);
            self.settingsRegion.$el.toggle(false);
            self.dataRegion.$el.toggle(false);
        });

        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_SETTINGS_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(false);
            self.settingsRegion.$el.toggle(true);
            self.dataRegion.$el.toggle(false);
        });

        this.listenTo(mainHeaderLayout, mainHeaderLayout.EVENT_DATA_TAB_SELECTED, function () {
            self.homeRegion.$el.toggle(false);
            self.settingsRegion.$el.toggle(false);
            self.dataRegion.$el.toggle(true);
        });
    }

});