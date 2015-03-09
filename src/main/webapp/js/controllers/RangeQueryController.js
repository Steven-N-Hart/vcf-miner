/**
 * Controller for Range Query tab
 * @type {*}
 */
var RangeQueryController = Backbone.Marionette.Controller.extend({

    workspaceKey: null,
    userToken: null,

    /** The Range Query Tab - Layout */
    rangeQueryFilterTabLayout: null,


    /** This is initialized when the RangeQueryController object is created in TestApplication.js ??????? */
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
        options.region.show(this.rangeQueryFilterTabLayout);
    },

    // Upload the ranges to the server and get a response.  If error, then display an error in the message line
    uploadRanges : function(rangeQuery) {

        var xhr = new XMLHttpRequest();

        var async = false;
        xhr.open('POST', "/mongo_svr/ve/rangeSet/workspace/" + MongoApp.workspaceKey, async);

        xhr.onload = function(oEvent) {
            if (xhr.status == 200) {
                console.log("Uploaded!");

                // TODO:

            } else {

                // TODO:

                console.log("Error " + xhr.status + " occurred uploading file");
                genericAJAXErrorHandler(xhr);

                // If there were errors, then show them in the error dialog
                if( errorMsg != "" )
                    this.showErrorMsg("Error uploading ranges: " + errorMsg);
            }
        };

        var formData = new FormData;
        formData.append('name',                rangeQuery.get("name"));
        formData.append('intervalDescription', rangeQuery.get("description"));
        formData.append('rangeSetText',        rangeQuery.get("ranges"));
        formData.append('file',                rangeQuery.get("file"));

        xhr.send(formData);
    }
});