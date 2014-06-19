MainLayout = Backbone.Marionette.Layout.extend({

    template: "#main-layout-template",

    regions: {
        mainHeaderRegion:           '#mainHeaderRegion',
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

        var self = this;
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_DATA_LOADED, function() {
            MongoApp.variantDataController.showVariantTable({region: self.variantDataRegion});

            self.initJqueryUI();
        });
    },

    /**
     * Delegated events
     */
    events: {
        "click #show_add_filter_dialog_button" : "showAddFilterDialog"
    },

    onShow: function() {

        this.mainHeaderRegion.show(new MainHeaderLayout());

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

    /**
     * Setup the jquery ui layout
     */
    initJqueryUI: function() {

        var layout = this.$el.find('#jquery-ui-container').layout({
            //	reference only - these options are NOT required because 'true' is the default
            closable:					true	// pane can open & close
            ,	resizable:					true	// when open, pane can be resized
            ,	slidable:					true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            ,	livePaneResizing:			true

            ,	buttonClass:			"button"	// default = 'ui-layout-button'
            ,	togglerClass:			"toggler"	// default = 'ui-layout-toggler'
            ,	togglerLength_open:		35			// WIDTH of toggler on north/south edges - HEIGHT on east/west edges
            ,	togglerLength_closed:	35			// "100%" OR -1 = full height

            //	some resizing/toggling settings
    //        ,	north__size:			    50	    // OVERRIDE size of header height
    //        ,	north__resizable:			false	    // OVERRIDE
    //        ,	north__closable:			false	    // OVERRIDE
    //        ,	north__slidable:			false	// OVERRIDE the pane-default of 'slidable=true'
    //        ,	north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
    //        ,	south__resizable:			false	// OVERRIDE the pane-default of 'resizable=true'
    //        ,	south__spacing_open:		0		// no resizer-bar when open (zero height)
    //        ,	south__spacing_closed:		20		// big resizer-bar when open (zero height)

            //	some pane-size settings
            ,	west__minSize:				200
            ,	west__size: 				450
            ,	west__spacing_closed:		5			// wider space when closed
            ,	west__togglerLength_closed:	-1			// -1 = full height
            ,	west__togglerAlign_closed:	"top"		// align to top of resizer
            ,	west__togglerLength_open:	0			// NONE - using custom togglers INSIDE west-pane
            ,	west__togglerTip_open:		"Hide Analysis"
            ,	west__togglerTip_closed:	"Show Analysis"
            ,	west__resizerTip_open:		"Resize Filter Pane"
            ,   west__togglerContent_closed: '<i class="fa fa-arrow-right"></i>'
            ,	west__slideTrigger_open:	"click" 	// default
            ,	west__slideTrigger_close:	"click" 	// default
            ,	west__initClosed:			false
    //        ,	west__fxSettings_open:		{ easing: "easeOutBounce" } //	add 'bounce' option to default 'slide' effect
            ,   west__onopen_end:           function() // hide show button
            {
                $("#west-opener").toggle(false);
            }
            ,   west__onclose_end:          function() // make show button visible
            {
                $("#west-opener").toggle(true);
            }

    //        ,	east__size:					300
    //        ,	east__minSize:				200
    //        ,	east__maxSize:				.5 // 50% of layout width
            ,	center__minWidth:			100

            //	some pane animation settings
            ,	west__animatePaneSizing:	false
            ,	west__fxSpeed_size:			"fast"	// 'fast' animation when resizing west-pane
            ,	west__fxSpeed_open:			1000	// 1-second animation when opening west-pane
            ,	west__fxSettings_open:		{ easing: "easeOutQuint" }
            ,	west__fxSettings_close:		{ easing: "easeInQuint" }

            //	enable showOverflow on west-pane so CSS popups will overlap north pane
            ,	west__showOverflowOnHover:	true

            //	enable state management
            ,	stateManagement__enabled:	true // automatic cookie load & save enabled by default

            ,	showDebugMessages:			true // log and/or display messages from debugging & testing code
        });

        layout.addCloseBtn("#west-closer", "west");

        // always make sure west pane is open
        layout.open("west");
        layout.resizeAll();
    }

});