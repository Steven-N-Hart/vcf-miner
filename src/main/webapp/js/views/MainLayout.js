MainLayout = Backbone.Marionette.Layout.extend({

    template: "#main-layout-template",

    regions: {
        workspaceRegion:            '#workspaceRegion',
        searchNameRegion:           '#searchNameRegion',
        searchDescriptionRegion:    '#searchDescriptionRegion',
        searchFiltersRegion:        '#searchFiltersRegion',
        searchSaveRegion:           '#searchSaveRegion',
        variantDataRegion:          '#variantDataRegion',
        settingsRegion:             '#settings_region'
    },

    /**
     * Called when the view is first created
     */
    initialize: function() {
        this.addFilterDialog = new AddFilterDialog();
    },

    /**
     * Delegated events
     */
    events: {
        "click #navbar_tabs a" : "switchTab",

        // clicking on brand is redirected to a click on home tab
        "click .navbar .brand" : "switchHomeTab",

        "click #show_add_filter_dialog_button" : "showAddFilterDialog"
    },

    onShow: function() {
        MongoApp.workspaceController.showWorkspaceTable({region: this.workspaceRegion });

        MongoApp.searchController.showSearchName({region: this.searchNameRegion });
        MongoApp.searchController.showSearchDescription({region: this.searchDescriptionRegion });
        MongoApp.searchController.showSearchFilterTable({region: this.searchFiltersRegion });
        MongoApp.searchController.showSearchSave({region: this.searchSaveRegion });

        MongoApp.settingsController.showSettingsTab({region: this.settingsRegion});

        // display Getting started
        var welcomePane = this.$el.find('#welcome_pane');
        this.$el.find('#getting_started_content').append(welcomePane);
        welcomePane.toggle();
    },


    showAddFilterDialog: function() {
        this.addFilterDialog.show();
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
    }

});