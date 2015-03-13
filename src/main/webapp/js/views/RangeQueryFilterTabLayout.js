/**
 * Layout that allows the user to create a range query.
 *
 * @type {*}
 */
RangeQueryFilterTabLayout = Backbone.Marionette.Layout.extend({

    template: "#range-query-tab-layout-template",

    rangeQuery: null,

    regions: {
        rangeQueryRegion: "#rangeQueryRegion"
        //rangesRichTextAreaRegion: "#rangeQueryTextArea"
    },

    /**
     * Maps UI elements by their jQuery selectors
     */
    ui: {
    },

    events: {
        // Validate the ranges when the text field loses focus
        // (calls the function within this class which in turns calls the function within RangeQueryController (thru TestApplication)
        "blur  #editor" : "validateRangeQueries",
        //"input  #editor" : "validateRangeQueries"

        // Add listener to "Name" field - show '*' (and error msg as hint text) if name doesn't contain only letters, numbers, underscores
        "input  #range_name_field" : "validateName",

        // Add listener to rich-text field to catch any tabs and jump to next field, instead of inserting an html indent code (which requires SHIFT-TAB to remove)
        // Ex: http://javascript.info/tutorial/keyboard-events
        // TODO: Need to figure out how to capture tabs yet
        // TODO: Main issue: The #editor is a "div", not an "input" element - how do you capture character codes in divs?
        // TODO: Can we get the underlying "input" element and put an event listener on that?
        "keyup  #editor" : "escapeTabs",
        "keydown #editor" : "escapeTabs",
        "keypress #editor" : "escapeTabs",
        "input   #editor"  : "escapeTabs",
        "keydown" : "escapeTabs",

        // TEMP
        "keydown #range_name_field" : "escapeTabs",
        // ---------

        "click  #resetFileButton" : "resetFile",


        // Handle the file upload with better looking components:
        "click   #browseFileButton"  : "browseForFile",
        "change  #bedFileUpload"     : "putFileNameInLabel"
    },


    // stickit 2-way binding setup - tie the fields on the panel to the "model" which is the RangeQuery object
    bindings: {
        // Bind html text field with id "range_name_field" to RangeQuery.name
        '#range_name_field': 'name',

        // Bind html text field with id "range_desc_field" to RangeQuery.description
        '#range_desc_field': 'description',

        // Bind html rich-text area with id "editor" to RangeQuery.ranges
        '#editor': 'ranges',

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
            self.handleUploadRangeQueriesComplete(isBackground, rangeName);
        });
    },

    // This is called by RangeQueryController.js to show the regions that are created in the initialize() method above
    onShow: function() {
        //this.rangeQueryRegion.show(????);

        //this.filtersRegion.show(this.sampleFilterLayout);
        //this.samplesRegion.show(this.sampleSelectionLayout);

        // TEMP:  Try fading out the bed file upload div just to see if this javascript works
        //$('#bedFileUpload').hide();
        //$('#XSplit').hide();

        // Show the rich text editor for the user-entered ranges
        // http://mindmup.github.io/bootstrap-wysiwyg/
        var editor = $('#editor');
        $('#editor').wysiwyg();

    },

    createRangeAnnotation: function() {

        if (this.isAllValid()) {
            // TODO:  Create a rangeQuery from the fields using jQuery selections.  Use this until bindings are working.
            this.rangeQuery = this.createRangeQueryFromFields();

            // If the event mentioned above that is tied to the "Create Range Annotation" button is triggered,
            //     then trigger the RangeQueryController.uploadRangeQueries() function
            MongoApp.dispatcher.trigger("uploadRangeQueries", this.rangeQuery);
        }
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

        var rangeHtml = $("#editor").html();
        // Remove line breaks by replacing with newlines
        var rangeText = rangeHtml.replace(/<br>/g,  "\n");

        var rangeQuery = new RangeQuery({
            name : $("#range_name_field").val(),
            description : $("#range_desc_field").val(),
            ranges : rangeText,
            file : $('#bedFileUpload')[0].files[0]
        } );
        return rangeQuery;
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
    isAllValid: function() {
        // Validate the ranges, highlight any that have errors, and show the error count
        var numErrors = this.validateRangeQueries();

        var isNameOk = this.validateName();

        // TODO: add the following validation checks
        // 1. at least text area range OR file must be specified
        var isRangeOrFileSpecified = true;

        if (numErrors == 0  &&  isNameOk && isRangeOrFileSpecified) {
            return true;
        } else {
            return false;
        }
    },

    /* VAlidate the rich-text field range queries, and return number of errors */
    validateRangeQueries: function() {
        // Validate the ranges, highlight any that have errors, and show the error count
        // (Returns 'true' if all ranges were ok)
        var numErrors = this.countBadRanges();

        // Update the error count in parentheses
        this.updateErrorCount(numErrors);

        // Update the ranges regardless of whether there were errors or not, since we want to remove bad tags and
        // update the text area in case there were errors previously (to clear the highlighted errors)
        this.highlightBadRanges();

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

    // Highlight those ranges within the rich text area that do NOT meet the range criteria and
    // bold, italicize, and red-color them
    // NOTE: We will have to strip out any tags before uploading on subsequent calls.
    highlightBadRanges: function() {
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
    },

   // Trigger event when text changes in the rich-text field for ranges.
    escapeTabs: function(eventObj) {
        var TABKEY = 9;
        var c1 = eventObj.charCode;
        var c2 = eventObj.keyCode;
        var c3 = eventObj.which;
        var charCode = eventObj.charCode || eventObj.keyCode || eventObj.which;
        return;
        var keyCode = event.keyCode;
        // If tab is detected, then set focus on the next field, which is the file upload, and cancel the tab character input
        // See: http://stackoverflow.com/questions/3362/capturing-tab-key-in-text-box
        if(keyCode == TABKEY) {
            var fileUploadObj = $("#bedFileUpload");
            fileUploadObj.focus();
            if(e.preventDefault) {
                e.preventDefault();
            }
            return false;
        }
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

