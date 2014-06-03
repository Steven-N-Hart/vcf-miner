/**
 * Marionette application.
 *
 * @type {Backbone.Marionette.Application}
 */

// create the Marionette application
var MongoApp = new Backbone.Marionette.Application();

/**
 * Marionette regions defined in the DOM
 */
MongoApp.addRegions({
    workspaceRegion:     '#workspaceRegion',
    searchNameRegion:    '#searchNameRegion',
    searchDescriptionRegion:    '#searchDescriptionRegion',
    searchTableRegion:   '#searchTableRegion',
    searchFiltersRegion: '#searchFiltersRegion',
    searchSaveRegion:    '#searchSaveRegion',
    variantDataRegion:   '#variantDataRegion'
});

/**
 * Global settings for entire system.
 */
MongoApp.addInitializer(function () {

    this.events = {
        // system error has occurred
        ERROR: 'error',

        // User is choosing a different workspace
        WKSP_LOAD: 'workspaceLoad',

        // current Workspace model has been changed
        WKSP_CHANGE: 'workspaceChange',

        // signals that a new sample group should be created
        WKSP_GROUP_CREATE: 'workspaceGroupCreate',

        // signals that the given workspace should be removed
        WKSP_REMOVE: 'workspaceRemove',

        // download the current search results of the workspace
        WKSP_DOWNLOAD: 'workspaceDownload',

        // User is choosing a different search
        SEARCH_LOAD: 'searchLoad',

        // current Search model has been changed
        SEARCH_CHANGE: 'searchChange',

        // signals that a new filter should be added to the search
        SEARCH_FILTER_ADD: 'filterAdd',

        // signals that a filter has been added to the search
        SEARCH_FILTER_ADDED: 'searchFilterAdded',

        // signals that an existing filter should be removed from the search
        SEARCH_FILTER_REMOVE: 'filterRemove',

        // signals that an existing filter has been removed from the search
        SEARCH_FILTER_REMOVED: 'searchFilterRemoved',

        // signals that the search should be saved to the server-side persistence store
        SEARCH_SAVE: 'saveSearch',

        // signals that the search should be deleted from the server-side persistence store
        SEARCH_DELETE: 'deleteSearch',

        // signals that the search should be exported to a file on the client
        SEARCH_EXPORT: 'exportSearch',

        // signals that the search should be imported from a file on the client
        SEARCH_IMPORT: 'importSearch',

        // signals that a dialog showing the search objects should be shown
        SEARCH_SHOW_DIALOG: 'showSearchDialog'
    };

    // GLOBAL
    this.settings =
    {
        maxFilteredVariants: 0,
        popupDuration: 0, // seconds
        maxFilterValues: 0,
        showMissingIndexWarning: false
    };

    // GLOBAL
    this.indexController = new DatabaseIndexController();
    this.search = new Search();

    // constants
    this.FILTER_NONE         = new Filter({name: 'none', displayName: 'none', operator: FilterOperator.UNKNOWN, displayOperator: '',  value: '' , displayValue: '', id:'id-none'}),
    this.FILTER_IN_GROUP     = new GroupFilter({name: 'Samples in Group',     operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.IN_GROUP, description:'Filters variants based on matching samples'});
    this.FILTER_NOT_IN_GROUP = new GroupFilter({name: 'Samples not in Group', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.NOT_IN_GROUP, description:'Filters variants based on non-matching samples'});
    this.FILTER_MIN_ALT_AD   = new AltAlleleDepthFilter();

});

/**
 * Setup the jquery ui layout
 */
MongoApp.addInitializer(function() {

    this.layout = $('#jquery-ui-container').layout({
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

    this.layout.addCloseBtn("#west-closer", "west");
});

/**
 * Marionette controllers
 */
MongoApp.addInitializer(function () {
    this.workspaceController = new WorkspaceController();
    this.workspaceController.showWorkspaceTable({region: MongoApp.workspaceRegion });

    var settingsController = new SettingsController();
    // TODO: fix region
    settingsController.showSettingsTab({region: MongoApp.TODO });

    this.searchController = new SearchController();
    this.searchController.showSearchName({region: MongoApp.searchNameRegion });
    this.searchController.showSearchDescription({region: MongoApp.searchDescriptionRegion });
    this.searchController.showSearchTable({region: MongoApp.searchTableRegion });
    this.searchController.showSearchFilterTable({region: MongoApp.searchFiltersRegion });
    this.searchController.showSearchSave({region: MongoApp.searchSaveRegion });

    new VariantDataController();

    // Wire Marionette events to function callbacks
    MongoApp.vent.on(MongoApp.events.ERROR, function (errorMessage) {
        // show error message in new browser window
        var ERROR_TEMPLATE = $("#error-message-template").html();
        window.open().document.write(_.template(ERROR_TEMPLATE, {message: errorMessage}))
    });

    MongoApp.vent.on(MongoApp.events.WKSP_LOAD, function (newWorkspace, search) {
        MongoApp.workspace = newWorkspace;

        MongoApp.vent.trigger(MongoApp.events.WKSP_CHANGE, MongoApp.workspace);

        search.set("key", MongoApp.workspace.get("key"));
        MongoApp.vent.trigger(MongoApp.events.SEARCH_LOAD, search);
    });

    MongoApp.vent.on(MongoApp.events.SEARCH_LOAD, function (newSearch) {

        // make copy that we can safely modify
        var s = newSearch.clone();

        // detach backbone collection attributes
        var filters = s.get("filters");
        s.unset("filters");

        // carry over non-collection attributes
        MongoApp.search.set(s.attributes);

        // rebuild backbone collection attributes
        MongoApp.search.get("filters").reset();
        var async = false; // async is FALSE because we need to add multiple filters in sequence
        if (filters.length == 0) {
            // only have the NONE filter, okay to have it async
            async = true;
        }
        MongoApp.vent.trigger(MongoApp.events.SEARCH_FILTER_ADD, MongoApp.FILTER_NONE, async);
        _.each(filters.models, function(filter) {
            MongoApp.vent.trigger(MongoApp.events.SEARCH_FILTER_ADD, filter, async);
        });

        MongoApp.search.set("saved", true);
        MongoApp.vent.trigger(MongoApp.events.SEARCH_CHANGE, MongoApp.search);
    });
});

/**
 *
 */
MongoApp.addInitializer(function () {
    //test for MSIE x.x;
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent))
    {
        $('#getting_started_content').append($('#browser_not_supported_pane'));
        $('#browser_not_supported_pane').toggle();

        // end execution here
        return;
    }
    else
    {
        $('#getting_started_content').append($('#welcome_pane'));
        $('#welcome_pane').toggle();
    }

    // clicking on brand is redirected to a click on home tab
    $('.navbar .brand').click(function(e)
        {
            $('#home_tab').click();
        }
    );

    // handle click event on navbar tabs
    $('#navbar_tabs a').click(function (e)
    {
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
        var parent = $(this).parent();
        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');

        $(this).tab('show');
    })
});
