/**
 * Layout that allows the user to create a range query.
 *
 * @type {*}
 */
RangeQueryFilterTabLayout = Backbone.Marionette.Layout.extend({

    template: "#range-query-tab-layout-template",

    rangeQuery: null,
    numRanges : 0,
    numRangeErrors : 0,
    errorMsgTimeoutEventValidation : null,
    errorMsgTimeoutEventRanges : null,

    highlightTimeout : null,

    regions: {
        rangeQueryRegion: "#rangeQueryRegion"
    },

    /** Maps UI elements by their jQuery selectors    */
    ui: {
    },

    events: {
        // The html button id "uploadRangeQueries" is linked to the event listener
        // (calls the function within this class which in turns calls the function within RangeQueryController (thru TestApplication)
        "click #uploadRangeQueries" : "createRangeAnnotation",

        // Add listener to "Name" field - show '*' (and error msg as hint text) if name doesn't contain only letters, numbers, underscores
        "input  #range_name_field" : "validateName",

        // Add listener to ranges text-area to highlight any rows that are bad
        // Do this on blur and focus
        "keyup  #rangesTextArea"  : "setHighlightTimeout",
        "blur   #rangesTextArea"  : "validateRangeQueries",

        "click  #resetFileButton" : "resetFile",

        // Handle the file upload with better looking components:
        "click   #browseFileButton"  : "browseForFile",
        "change  #bedFileUpload"     : "putFileNameInLabel"
    },

    // TODO: Bindings not currently working - uses createRangeAnnotation() method to create the ranges to send to the controller
    // stickit 2-way binding setup - tie the fields on the panel to the "model" which is the RangeQuery object
    bindings: {
        // Bind html text field with id "range_name_field" to RangeQuery.name
        '#range_name_field': 'name',

        // Bind html text field with id "range_desc_field" to RangeQuery.description
        '#range_desc_field': 'description',

        // Bind html rich-text area with id "editor" to RangeQuery.ranges
        '#rangesTextArea': 'ranges',

        // Bind html file upload component with id "bedFileUpload" to RangeQuery.filename
        '#bedFileUpload': 'file'
    },

    /**
     * Called when the view is first created
     */
    initialize: function(options) {

        this.localDispatcher = options.localDispatcher;

        var self = this;

        this.localDispatcher.on("createRangeAnnotation", function(){
            self.createRangeAnnotation();
        });

        MongoApp.dispatcher.on("uploadRangeQueriesComplete", function(isBackground, rangeName){
            $('#rangeQueryWaitDialog').modal('hide');
            self.handleUploadRangeQueriesComplete(isBackground, rangeName);
        });
        MongoApp.dispatcher.on("uploadRangeQueriesFailed", function(){
            $('#rangeQueryWaitDialog').modal('hide');
        });

    	// Initialize the highlighting of the text area only once
        // Afterwards we will update the ranges after each keypress and refresh the highlight
        // See:
        //      http://mistic100.github.io/jquery-highlighttextarea/
        //      http://bebo.minka.name/k2work/libs.js/jquery/2.1.0/highlightTextarea/
        $('#rangesTextArea').highlightTextarea({
            color: 'orange'
        });

        $('#rangeQueryWaitDialog').off();
        $('#rangeQueryWaitDialog').on('shown', function () {
            // If the event mentioned above that is tied to the "Create Range Annotation" button is triggered,
            //     then trigger the RangeQueryController.uploadRangeQueries() function
            MongoApp.dispatcher.trigger("uploadRangeQueries", self.rangeQuery);
        })
    },

    // This is called by RangeQueryController.js to show the regions that are created in the initialize() method above
    onShow: function() {
    },

    /** "Upload Range Query"  button event
     *  NOTE: This triggers a call to the function "uploadRangeQueries" in RangeQueryController
     */
    createRangeAnnotation: function(event) {

        // Clear the error msg at the bottom in case there was one there previously
        $("#errorMsgAfterUpload").text("");

        var isNameOk = this.validateName();
        if( ! isNameOk ) {
            this.showValidationErrorMsg("Error: Name must be at least one character and can only contain letters, numbers, or underscores");
            return;
        }

        if( this.numRangeErrors > 0 ) {
            this.showValidationErrorMsg("Error: One or more ranges in the text area contain errors");
            return
        }

        var fileObj = $("#bedFileUpload")[0];
        var filename = "";
        if( fileObj.files.length > 0 )
            filename = fileObj.files[0].name;
        if( this.numRanges == 0  &&  ( ! filename  ||  filename.length == 0) ) {
            this.showValidationErrorMsg("Error: You must specify at least one valid range in the text area, or a file containing ranges");
            return;
        }

        //---------------------------------------------------------------------
        // If we've reach this far, that means we have:
        //   - a valid name
        //   - no range errors in the text area
        //   - at least one valid range in the text area, or a filename to upload
        // So, create a RangeQuery object and send it to the RangeQueryController.uploadRangeQueries() function
        //---------------------------------------------------------------------
        // TODO:  Create a rangeQuery from the fields using jQuery selections.  Use this until bindings are working.

        this.rangeQuery = this.createRangeQueryFromFields();

        $('#rangeQueryWaitDialog').modal('show');
    },

    handleUploadRangeQueriesComplete: function(isBackground, rangeName) {

        var self = this;

        if (isBackground) {

            var title = 'Range Annotation Status';
            var mesg  = '<p>Your range annotation has been successfully submitted and will be processed.</p>' +
                        '<p>When processing completes, your VCF File will contain a new annotation named <strong>' + rangeName + '</strong>.  ' +
                        'You can utilize this new annotation by clicking the Add Filter button and selecting it in the Annotation tab.</p>'+
                        '<p>You will now go back to the Home screen.</p>';
            var messageDialog = new MessageDialog(title, mesg);
            messageDialog.localDispatcher.on(messageDialog.EVENTS.EVENT_OK, function() {
                // signal back to the parent dialog that we're done
                self.localDispatcher.trigger("tabFinished");

                // close tab
                MongoApp.dispatcher.trigger(MongoApp.events.WKSP_CLOSE);
            });
            messageDialog.show();

        } else {
            // INTERACTIVE

            // signal back to the parent dialog that we're done
            this.localDispatcher.trigger("tabFinished");
        }
    },

    // TEMP:  Create a rangeQuery from the fields using jQuery selections.  Use this until bindings are working.
    createRangeQueryFromFields : function() {
        var rangesText = $("#rangesTextArea").val();
        var rangeQuery = new RangeQuery({
            name : $("#range_name_field").val(),
            description : $("#range_desc_field").val(),
            ranges : rangesText,
            file : $('#bedFileUpload')[0].files[0]
        } );
        return rangeQuery;
    },

    // Check if the name is valid.  If not, show error '*' on end and color text field font red.  Return true if ok, false if invalid.
    validateName : function() {
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

    /* When the ranges text area loses focus, show an error msg if there are any errors with the ranges. */
    validateRangeQueries: function() {
        if (this.numRangeErrors > 0 ) {
            this.showRangeErrorMsg("Please correct the errors in the ranges.");
        } else {
            this.showRangeErrorMsg("");
        }
    },

    updateErrorCount : function(numErrors, numRanges) {
        var numErrorsStr = numErrors + " errors";
        if( numErrors == 1 )
            numErrorsStr = "1 error";

        var numRangesStr = numRanges + " ranges";
        if( numRanges == 1 )
            numRangesStr = "1 range";

        var msg = "(" + numErrorsStr + ", " + numRangesStr + ")";

        $("#numErrors").html(msg);
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

    showRangeErrorMsg: function(errorMsg) {
        // Cancel any previous event timing
        clearTimeout(this.errorMsgTimeoutEventRanges);

        var errorMsgObj = $("#rangesErrorMsg");

        // Set the error msg
        errorMsgObj.text(errorMsg);

        // Show the error msg  (NOTE: fadeIn() doesn't appear to work)
        // Fade in to full intensity after 300ms
        errorMsgObj.fadeTo(300,1);

        // After 5000ms, begin fading out completely over 2000ms
        this.errorMsgTimeoutEventRanges = window.setTimeout(function() {
            errorMsgObj.fadeTo(2000, 0);
        }, 5000);
    },

    showValidationErrorMsg: function(errorMsg) {
        // Cancel any previous event timing
        clearTimeout(this.errorMsgTimeoutEventValidation);

        var errorMsgObj = $("#errorMsgAfterUpload");

        // Set the error msg
        errorMsgObj.text(errorMsg);

        // Show the error msg  (NOTE: fadeIn() doesn't appear to work)
        // Fade in to full intensity after 300ms
        errorMsgObj.fadeTo(300,1);

        // After 5000ms, begin fading out to 30% intensity over 2000ms
        this.errorMsgTimeoutEventValidation = window.setTimeout(function() {
            errorMsgObj.fadeTo(2000, 0.3);
        }, 5000);
    },

    setHighlightTimeout : function(eventObj) {
        // Cancel any previous event timing
        clearTimeout(this.highlightTimeout);

        // After 1000ms, highlight any bad text
        // This allows a bit of delay so it doesn't look like we are punishing the user immediately for starting to edit a range
        var thisObj = this;
        this.highlightTimeout = window.setTimeout(function() {
            thisObj.highlightBadRangeRows(eventObj);
        }, 1000);
    },


    // Trigger event when text changes in the text-area
    // Highlight rows that are not valid ranges
    highlightBadRangeRows : function(eventObj) {
        // Split the ranges text area by newlines
        var rangesTextAreaObj = $("#rangesTextArea");
        var rangesAll = rangesTextAreaObj.val();
        var rows = rangesAll.split("\n");
        this.numRanges = 0;
        this.numRangeErrors = 0;
        var rowStart = 0;
        var badRangesJson = new Array();
        // Loop through all lines, and add any bad ones to the badRangesJson array
        for(var i=0; i < rows.length; i++) {
            // If the row is blank, disregard it
            var isBlank = rows[i].trim().length == 0;
            // Else, if it is bad, then add it to the badRanges array
            var end = rowStart + rows[i].length;
            if( ! isBlank ) {
                this.numRanges++;
                if( ! this.isValidRow(rows[i]) ) {
                    badRangesJson.push([rowStart, end]);
                    this.numRangeErrors++;
                }
            }
            // Add 1 to the end to skip the newline character at the end of each row
            rowStart = end + 1;
        }

        // Highlight the badRanges rows in orange within the text area
        // Format of the json object must be similar to:       "["mike","bad"]"
        // Where internal quotes are escaped with backslashes: "[\"mike\",\"bad\"]"
        // OR an array of ranges: "[[0,1],[3,10]]"
        //    var badRangesJson2 = JSON.parse("[[0,15],[20,25],[26,34],[35,43]]");
        //    var badRangesJson3 = [[0,15],[20,25]];
        // SEE:  http://mistic100.github.io/jquery-highlighttextarea/
        // IMPORTANT:  This is how to update it after the initialization!!!:
        //     http://bebo.minka.name/k2work/libs.js/jquery/2.1.0/highlightTextarea/
        rangesTextAreaObj.highlightTextarea('setOptions', {color : 'orange'});
        rangesTextAreaObj.highlightTextarea('setRanges', badRangesJson);
        rangesTextAreaObj.highlightTextarea('highlight');

        // Update the error count above the text area
        this.updateErrorCount(this.numRangeErrors, this.numRanges);
    },

    // Reset the file path
    resetFile: function() {
        var fileUploadObj = $("#bedFileUpload");
        // Clear the file path  (wrap in a form and reset all objects in the form, then unwrap)
        //   SEE:  http://stackoverflow.com/questions/1043957/clearing-input-type-file-using-jquery/13351234#13351234
        fileUploadObj.wrap('<form>').closest('form').get(0).reset();
        fileUploadObj.unwrap();

        // Clear out the label as well (it has a copy of the filename as well):
        $("#filenameLabel").html("(No file selected)");
    },


    browseForFile: function(){
        $("#bedFileUpload").click();
    },

    putFileNameInLabel : function(fileObj){
        var filename = fileObj.target.value;
        $("#filenameLabel").html(filename);
    }
});
