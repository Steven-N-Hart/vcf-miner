/**
 * Controller for Range Query tab
 * @type {*}
 */
var RangeQueryController = Backbone.Marionette.Controller.extend({

    workspaceKey: null,
    userToken: null,

    /** Range query object that represents all data on the tab */
    rangeQuery: null,

    /** The Range Query Tab - Layout */
    rangeQueryFilterTabLayout: null,


    /** This is initialized when the RangeQueryController object is created in TestApplication.js ??????? */
    initialize: function (options) {

        // Get the overall object from the highest level application (TestApplication.js in this case)
        this.rangeQuery  = options.rangeQuery;

        // NOTE: This requires the RangeQueryFilterTabLayout.js file to be imported in the html file BEFORE the RangeQueryController.js
        this.rangeQueryFilterTabLayout = new RangeQueryFilterTabLayout({
            rangeQuery: this.rangeQuery
        } );


        //===================================================================
        // Wire events to functions
        //===================================================================
        // Create an instance variable of this class to pass to event handlers
        var rangeQueryControllerInstance = this;

        // TODO: replace TestApplication at integration time
        // The event mentioned in RangeQueryFilterTabLayout will trigger this listener,
        // and thus call the uploadRangeQueries() function
        MongoApp.vent.on("uploadRangeQueries", function (rangeQuery) {
            rangeQueryControllerInstance.validateAndUploadRangeQueries(rangeQuery);
        });

        MongoApp.vent.on("validateRangeQueries", function (rangeQuery) {
            rangeQueryControllerInstance.validateRangeQueries(rangeQuery);
        });

        MongoApp.vent.on("validateName", function (rangeQuery) {
            rangeQueryControllerInstance.validateName(rangeQuery);
        });

    },

    // This is called from TestApplication, passing in the mainRegion id from the html file
    showRangeQueryTab: function (options) {
        options.region.show(this.rangeQueryFilterTabLayout);
    },


    // Check if the name is valid.  If not, show error '*' on end and color text field font red.  Return true if ok, false if invalid.
    validateName : function(rangeQuery) {
        var nameFieldObj     = $("#range_name_field");
        var nameErrorStarObj = $("#nameErrorStar");
        var name = nameFieldObj.val();
        // Name is ok if it only contains letters, numbers and underscores
        var isOk = /^[a-zA-Z0-9_]+$/.test(name);
        if ( isOk ) {
            nameErrorStarObj.hide();
            nameFieldObj.css('color', 'black');
        } else {
            nameErrorStarObj.show();
            nameFieldObj.css('color', 'red');
        }

        return isOk;
    },

    /** Send range query to server for validation and processing when user clicks the "Create Range Annotation" button at the bottom of the panel
     * INPUT: RangeQuery object which should contain:
     *      Workspace key that matches one of the workspaces in Mongo server
     *      Usertoken for authentication and authorization
     *      Name of range query
     *      Description
     *      List of ranges from textarea
     *      Name of file to stream to server
     * RETURN: A JSON object with status on range queries that were uploaded
     * -----
     * Example curl call:
     *      curl -X POST  -F file=@interval.file --form rangeSetText=somerange --form intervalDescription="I Love Puppies"  http://localhost:8080/ve/rangeSet/workspace/foo/name/bar
     */
    validateAndUploadRangeQueries: function(rangeQuery) {
        // Validate the ranges, highlight any that have errors, and show the error count
        var numErrors = this.validateRangeQueries();

        var isNameOk = this.validateName(rangeQuery);

        if (numErrors == 0  &&  isNameOk) {
            // TEMP:  Create a rangeQuery from the fields using jQuery selections.  Use this until bindings are working.
            rangeQuery = this.createRangeQueryFromFields();
            this.uploadRanges(rangeQuery);
        }
    },


    // TEMP:  Create a rangeQuery from the fields using jQuery selections.  Use this until bindings are working.
    createRangeQueryFromFields : function() {
        var rangeQuery = new RangeQuery({
            name : $("#range_name_field").val(),
            description : $("#range_desc_field").val(),
            ranges : this.removeTags($("#editor").html()),
            filename : $("#bedFileUpload").val()
            } );
        return rangeQuery;
    },

    /* VAlidate the rich-text field range queries, and return number of errors */
    validateRangeQueries: function(rangeQuery) {
        // Validate the ranges, highlight any that have errors, and show the error count
        // (Returns 'true' if all ranges were ok)
        var numErrors = this.countBadRanges();

        // Update the error count in parentheses
        this.updateErrorCount(numErrors);

        // Update the ranges regardless of whether there were errors or not, since we want to remove bad tags and
        // update the text area in case there were errors previously (to clear the highlighted errors)
        this.highlightBadRanges(rangeQuery);

        if (numErrors > 0 ) {
            this.showErrorMsg("Please correct the errors in the ranges.");
        }

        return numErrors;
    },

    updateErrorCount : function(numErrors) {
        var numErrorsMsg = "(" + numErrors + " errors)";
        if( numErrors == 1 )
            numErrorsMsg = "(1 error)";
        $("#numErrors").html(numErrorsMsg);
    },

   // Validate all ranges in the user-entered rich-text field.
    // Return "true" if all ranges are valid, else return "false"
    countBadRanges : function() {
        // Get the HTML value from the rich-text editor
        var rangesAll = $("#editor").html();
        var txt = $("#editor").text();
        var lenTxt = txt.length;
        var chars = txt.split('');

        //  This appears to do nothing:
        //var rangesAll = $("#editor").val();
        //  This gets the text all jumbled together (no <br> tags for line breaks)
        //var rangesAll = $("#editor").text();
        rangesAll = this.removeTags(rangesAll);

        // Split into lines  (new lines appear as "<br>" tags in the html value for the element)
        var rows = rangesAll.split("<br>");
        var numBadRanges = 0;
        for( var i=0; i < rows.length; i++) {
            var row = rows[i].trim();

            // If the row is blank or empty spaces/tabs, then ignore it
            if( row.length == 0 )
                continue;

            // If first 3 columns are valid (chrom, start (int), stop (int)) it has less than 3 columns, return false (bad line)
            if( ! this.isValidRow(row) )
                numBadRanges++;
        }

        // Made it through all rows, so all are valid
        return numBadRanges;
    },

    // Given a string, remove all the tags that cause highlighting on rows with errors (font, bold and italics opening and closing tags)
    removeTags : function(txt) {
        // Remove opening tags: font, bold, italics
        var t1 = txt.replace(/<font color="red"><b><i>/g,  "");
        // Remove closing tags: italics, bold, font
        var t2 = t1.replace(/<\/i><\/b><\/font>/g, "");
        // Remove non-breaking spaces
        var t3 = t2.replace(/&nbsp;/g, "");
        return t3;
        //return txt.split("<font color='red'><b><i>").join().split("</i></b></font>").join();
    },

    // Take a string and check that:
    //    - The string (after splitting by several different types of characters) is an array of at least size 3
    //    - The 2nd column is a number
    //    - The 3rd column is a number
    isValidRow : function(row) {
        // Split by space, tab, comma, colon, hyphen
        var columns = row.split(/ |\t|,|:|-/);
        return  columns.length >= 3  &&  this.isNumber(columns[1])  &&  this.isNumber(columns[2]);
    },

    isNumber : function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },





    // Upload the ranges to the server and get a response.  If error, then display an error in the message line
    uploadRanges : function(rangeQuery) {
        // REST call to upload ranges:
        var urlStr   = "/mongosvr/ve/rangeSet/workspace/" + rangeQuery.workspaceKey + "/name/" + rangeQuery.rangeQueryName;
        var dataJson = {
            workspace:              rangeQuery.workspaceKey,
            name:                   rangeQuery.rangeQueryName,
            intervalDescription:    rangeQuery.rangeQueryDescription,
            rangeSetText:           rangeQuery.rangeQueryText,
            rangeBedFilename:       rangeQuery.rangeBedFilename
        };

        // Perform a *synchronous* call and get response
        var errorMsg = "";
        $.ajax({
            type:   "POST",
            url:    urlStr,
            data:   dataJson,
            dataType: "json",

            success: function(jsonResponse) {
                // TODO: Change all this
                try {
                    console.log("Returned json response.  Check for any errors from server validation and processing");
                } catch (exception) {
                    console.log("Failed to upload range queries");
                    jqueryAJAXErrorHandler(exception.jqXHR, exception.textStatus, exception.errorThrown);
                    MongoApp.dispatcher.trigger(MongoApp.events.METADATA_FIELDS_RETRIEVAL_FAILED);
                }
            },
            error: jqueryAJAXErrorHandler
         });

        // If there were errors, then show them in the error dialog
        if( errorMsg != "" )
            showErrorMsg("Error uploading ranges: " + errorMsg);
    },


    // Highlight those ranges within the rich text area that do NOT meet the range criteria and
    // bold, italicize, and red-color them
    // NOTE: We will have to strip out any tags before uploading on subsequent calls.
    highlightBadRanges: function(rangeQuery) {
        var rangesAll = $("#editor").html();
        rangesAll = this.removeTags(rangesAll);
        var rows = rangesAll.split("<br>");
        var newText = "";

        // Go through each row, highlight it if not valid, then concatenate it to the new text (with a new line at the end since we split that out)
        for(var i=0; i < rows.length; i++) {
            // If the row is blank, don't add it (discard all blank rows)
            if( rows[i].trim().length == 0 )
                continue;
            else if( this.isValidRow(rows[i]) )
                newText = newText.concat(rows[i]);
            else
                newText = newText.concat("<font color=red><b><i>").concat(rows[i]).concat("</i></b></font>");

            // Add the <br> tag to the end of each line except the last one
            if( i < (rows.length - 1) )
                newText = newText.concat("<br>");
        }

        // Now, update the value in the textarea
        $("#editor").html(newText);

        return newText;
    },

    showErrorMsg: function(errorMsg) {
        var errorMsgObj = $("#errorMsg");

        // Set the error msg
        errorMsgObj.text(errorMsg);

        // Show the error msg  (NOTE: fadeIn() doesn't appear to work)
        errorMsgObj.fadeTo(300,1);

        // Have error msg fade out 5 seconds
        window.setTimeout(function() {
            errorMsgObj.fadeTo(2000, 0);
        }, 5000);
    }
});