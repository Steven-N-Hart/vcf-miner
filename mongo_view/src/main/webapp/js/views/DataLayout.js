DataLayout = Backbone.Marionette.Layout.extend({

    // defaults to pinned
    analysis_pane_pinned: true,

    template: "#data-layout-template",

    regions: {
        searchNameRegion:           '#searchNameRegion',
        searchDescriptionRegion:    '#searchDescriptionRegion',
        searchFiltersRegion:        '#searchFiltersRegion',
        searchSaveRegion:           '#searchSaveRegion',
        variantDataRegion:          '#variantDataRegion'
    },

    /**
     * Called when the view is first created
     */
    initialize: function() {
        var self = this;
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_META_LOADED, function () {
            MongoApp.variantDataController.showVariantTable({region: self.variantDataRegion});

            self.jqueryUiLayout.addOpenBtn("#west-opener", "west");
        });
    },

    /**
     * Delegated events
     */
    events: {
        "click #show_add_filter_dialog_button" : "showAddFilterDialog",
        "mouseenter .ui-layout-west" : "handleWestPaneMouseEnter",
        "mouseleave .ui-layout-west" : "handleWestPaneMouseLeave",
        "mousedown .ui-layout-resizer-west" : "handleResizerMouseDown",
        "mouseup .ui-layout-resizer-west" : "handleResizerMouseUp",
        "click #analysis_resize" : "maximizeAnalysisPane",
        "click #analysis_pin" : "analysisPinClicked",
        "click .searchNew" : "newSearch",
        "click .searchSave" : "saveSearch",
        "click .searchDelete" : "deleteSearch",
        "click .showSearchDialog" : "showSearchDialog",
        "click .searchExport" : "exportSearch",
        "click .searchImport" : "importSearch",
        "click #export_button" :  "download",
        "click #columns_button":  "configColumns"
    },

    /**
     * Maximizes the Analysis pane's width to eliminate the horizontal scrollbar
     */
    maximizeAnalysisPane: function() {
        var westPane = this.$el.find(".ui-layout-west");
        var westPaneLeftPadding = westPane.outerWidth() - westPane.width();

        this.jqueryUiLayout.sizePane("west", this.$el.find("#ignore_autosize_div").outerWidth(true) + westPaneLeftPadding);
    },

    /**
     * Determines whether the analysis pane is pinned or not.
     *
     * @return
     *      TRUE if pinned, FALSE otherwise
     */
    isAnalysisPanePinned: function() {
//        return this.$el.find("#analysis_pin").hasClass("active");
        // disabled feature
        return true;
    },

    /**
     * Toggle the color of the thumbtack icon
     */
    analysisPinClicked: function() {
        var button = this.$el.find("#analysis_pin");
        var icon = this.$el.find("#analysis_pin > i");
        if (this.isAnalysisPanePinned()) {
            icon.addClass("fa-unlock");
            icon.removeClass("fa-lock");
        } else {
            icon.addClass("fa-lock");
            icon.removeClass("fa-unlock");
        }
    },

    handleWestPaneMouseEnter: function() {

        if (this.resizedWidth == undefined) {
            this.resizedWidth = this.jqueryUiLayout.state.west.outerWidth;
        }

        // get width of content inside west pane that was not auto-sized
        var ignoreAutosizeDivWidth = this.$el.find("#ignore_autosize_div").outerWidth(true);

        if (!this.isAnalysisPanePinned() && (ignoreAutosizeDivWidth > this.resizedWidth)) {
            this.jqueryUiLayout.sizePane("west", ignoreAutosizeDivWidth);
        }
    },

    handleWestPaneMouseLeave: function() {
        if (!this.isAnalysisPanePinned()) {
            this.jqueryUiLayout.sizePane("west", this.resizedWidth);
        }
    },

    handleResizerMouseDown: function() {
        this.resizerDrag = true;
    },

    handleResizerMouseUp: function() {
        this.resizerDrag = false;
    },

    onShow: function() {
        this.initJqueryUI();

        MongoApp.searchController.showSearchName({region: this.searchNameRegion });
        MongoApp.searchController.showSearchDescription({region: this.searchDescriptionRegion });
        MongoApp.searchController.showSearchFilterTable({region: this.searchFiltersRegion });
        MongoApp.searchController.showSearchSave({region: this.searchSaveRegion });

        this.jqueryUiLayout.sizePane("west", this.$el.find("#ignore_autosize_div").outerWidth(true));
    },

    showAddFilterDialog: function() {
        var region = new Backbone.Marionette.Region({
            el: this.$el.find("#add_filter_modal")
        });

        // delegate to add filter controller
        MongoApp.addFilterController.showAddFilterDialog(region);
    },

    /**
     * Setup the jquery ui layout
     */
    initJqueryUI: function() {

        var self = this;

        var container = this.$el.find('#jquery-ui-container');
        this.jqueryUiLayout = container.layout({
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
            ,	west__minSize:				425
            ,	west__size:                 425
            ,	west__spacing_closed:		5			// wider space when closed
            ,	west__togglerLength_closed:	-1			// -1 = full height
            ,	west__togglerAlign_closed:	"top"		// align to top of resizer
            ,	west__togglerLength_open:	0			// NONE - using custom togglers INSIDE west-pane
            ,	west__togglerTip_open:		"Hide Analysis"
            ,	west__togglerTip_closed:	"Show Analysis"
            ,	west__resizerTip_open:		"Resize Analysis"
            ,   west__togglerContent_closed: '<i class="fa fa-arrow-right"></i>'
            ,	west__slideTrigger_open:	"click" 	// default
            ,	west__slideTrigger_close:	"click" 	// default
            ,	west__initClosed:			false
            //        ,	west__fxSettings_open:		{ easing: "easeOutBounce" } //	add 'bounce' option to default 'slide' effect
            ,   west__onopen_end:           function() // hide show button
            {
                self.$el.find("#west-opener").toggle(false);
            }
            ,   west__onclose_end:          function() // make show button visible
            {
                self.$el.find("#west-opener").toggle(true);
            }
            ,  west__onresize_end: function (paneName, paneEl, paneState, paneOptions, layoutName) {

                // stretch to fill west pane
//                paneEl.find(".ui-layout-ignore").css("min-width", paneState.outerWidth);
//                paneEl.find(".nav-header > div").css("min-width", paneState.layoutWidth);

//                var resizerToolbar = paneEl.find("#resizer_toolbar");
//                resizerToolbar.css("left", paneState.layoutWidth - resizerToolbar.width());
//                // make sure buttons fill width of vertical toolbar
//                resizerToolbar.find("button").each(function() {
//                    $( this).css("width", resizerToolbar.width());
//                });



                // save away the "resized" width as the user drags the resizer widget
                if (self.resizerDrag) {
                    self.resizedWidth = paneState.outerWidth;
                }
            }

            ,  west__onshow: function (paneName, paneEl, paneState, paneOptions, layoutName) {
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

            //	disable showOverflow on west-pane
            ,	west__showOverflowOnHover:	false

            //	enable state management
            ,	stateManagement__enabled:	true // automatic cookie load & save enabled by default

            ,	showDebugMessages:			true // log and/or display messages from debugging & testing code
        });

        // associate the west close action to a button in the layout
        this.jqueryUiLayout.addCloseBtn("#west-closer", "west");

        // TODO: FIX ME
////        // always make sure west pane is open
//        this.jqueryUiLayout.open("west");
//        this.jqueryUiLayout.resizeAll();
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    saveSearch: function(e) {
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_SAVE, MongoApp.search);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    deleteSearch: function(e) {
        var confirmDialog = new ConfirmDialog(
            "Delete Analysis",
            "Delete " + MongoApp.search.get("name")  + "?",
            "Delete",
            function()
            {
                // confirm
                MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_DELETE, MongoApp.search);
            }
        );
        confirmDialog.show();
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    showSearchDialog: function(e) {
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_SHOW_DIALOG);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    exportSearch: function(e) {
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_EXPORT, MongoApp.search);
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    importSearch: function(e) {
        $('#import_search_modal').modal();
    },

    /**
     * Fire event to be handled by controller
     * @param e
     */
    newSearch: function(e) {
        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_LOAD, MongoApp.workspaceKey, new Search());
    },

    /**
     * Configure table columns by showing dialog box.
     */
    configColumns: function() {
        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_CONFIG_COLS);
    },

    download: function() {
        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_DOWNLOAD, MongoApp.workspaceKey, MongoApp.search);
    }

});