/**
 * Controller for Range Query tab
 * @type {*}
 */
var RangeQueryController = Backbone.Marionette.Controller.extend({

    workspaceKey: null,
    userToken: null,

    /** The Range Query Tab - Layout */
    rangeQueryFilterTabLayout: null,


    /** This is initialized when the RangeQueryController object is created in MongoApp.js ??????? */
    initialize: function (options) {

        //===================================================================
        // Wire events to functions
        //===================================================================
        // Create an instance variable of this class to pass to event handlers
        var rangeQueryControllerInstance = this;

        // The event mentioned in RangeQueryFilterTabLayout will trigger this listener,
        // and thus call the uploadRangeQueries() function
        MongoApp.dispatcher.on("uploadRangeQueries", function (rangeQuery) {
            rangeQueryControllerInstance.uploadRanges(rangeQuery);
        });
    },

    // This is called from TestApplication, passing in the mainRegion id from the html file
    showRangeQueryTab: function (options) {
        this.rangeQueryFilterTabLayout = new RangeQueryFilterTabLayout();
        options.region.show(this.rangeQueryFilterTabLayout);
    },

    // Upload the ranges to the server and get a response.  If error, then display an error in the message line
    uploadRanges : function(rangeQuery) {

        var formData = new FormData;
        formData.append('name',                rangeQuery.get("name"));
        formData.append('intervalDescription', rangeQuery.get("description"));
        formData.append('rangeSetText',        rangeQuery.get("ranges"));
        formData.append('file',                rangeQuery.get("file"));

        var self = this;
        $.ajax({
            url: "/mongo_svr/ve/rangeSet/workspace/" + MongoApp.workspaceKey,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            success: function(rangeUploadResponse) {

                var isBackground = rangeUploadResponse.isBackground;
                self.handleCreateAnnotationResponse(isBackground, rangeQuery.get("name"));

            },
            error: function(jqXHR, textStatus, errorThrown) {
                MongoApp.dispatcher.trigger('uploadRangeQueriesFailed');
                jqueryAJAXErrorHandler(jqXHR, textStatus, errorThrown);
            }
        });
    },

    /**
     * Act accordingly based the server's action to process the new range annotation.
     * @param isBackground
     *      Server is processing in the background TRUE/FLASE
     * @param rangeName
     *      The name of the range annotation.
     */
    handleCreateAnnotationResponse: function(isBackground, rangeName) {

        // refresh everything about the current workspaceKey to pick up the new INFO metadata
        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_REFRESH, MongoApp.workspaceKey);

        if (!isBackground) {

            // automatically add a new filter for this new range INFO FLAG field
            this.addNewBooleanFilter(rangeName);
        }

        MongoApp.dispatcher.trigger('uploadRangeQueriesComplete', isBackground, rangeName);
    },

    /**
     * Adds a new Boolean (FLAG) filter to the user's current Search
     *
     * @param infoFieldName
     */
    addNewBooleanFilter: function(infoFieldName) {

        var workspace = MongoApp.workspaceController.getWorkspace(MongoApp.workspaceKey);
        var infoField = workspace.get("dataFields").findWhere({name: infoFieldName});

        var filter = new Filter();
        filter.set("name",     infoFieldName);
        filter.set("description", infoField.get("description"));
        filter.set("operator", FilterOperator.EQ);
        filter.set("category", FilterCategory.INFO_FLAG);
        filter.set("value",    true);
        filter.setFilterDisplay();

        var newFilterStep = new FilterStep();
        newFilterStep.get("filters").add(filter);

        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_ADD, newFilterStep);

        var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_CHANGED, MongoApp.search, async);
    }
});