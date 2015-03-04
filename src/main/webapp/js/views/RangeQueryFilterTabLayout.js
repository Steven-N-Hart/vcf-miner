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
        //samplesRegion: "#sampleSelectionRegion"

        //rangesRichTextAreaRegion: "#rangeQueryTextArea"
    },

    /**
     * Maps UI elements by their jQuery selectors
     */
    ui: {
    },

    events: {
        // The class defined in the button element in the html is linked to the event listener here as ".uploadRangeQueries"
        // (calls the function within this class which in turns calls the function within RangeQueryController (thru TestApplication)
        "click .uploadRangeQueries" : "uploadRangeQueries",

        // Validate the ranges when the text field loses focus
        // (calls the function within this class which in turns calls the function within RangeQueryController (thru TestApplication)
        "blur  #editor" : "validateRangeQueries",
        //"input  #editor" : "validateRangeQueries"

        // Add listener to "Name" field - show '*' (and error msg as hint text) if name doesn't contain only letters, numbers, underscores
        "input  #range_name_field" : "validateName"
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
        '#bedFileUpload': 'filename'
    },




        /**
     * Called when the view is first created
     */
    initialize: function(options) {
        this.rangeQuery = options.rangeQuery;
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

    /** "Upload Range Query"  button event
     *  NOTE: This triggers a call to the function "uploadRangeQueries" in RangeQueryController
     */
    uploadRangeQueries: function(event) {
        // TODO: replace TestApplication at integration time
        // If the event mentioned above that is tied to the "Create Range Annotation" button is triggered,
        //     then trigger the RangeQueryController.uploadRangeQueries() function
        MongoApp.vent.trigger("uploadRangeQueries", this.rangeQuery);
    },

    validateRangeQueries: function(event) {
        // Trigger event when losing focus on the range textarea.
        // Call RangeQueryController.validateRangeQueries() function
        MongoApp.vent.trigger("validateRangeQueries", this.rangeQuery);
    },

    validateName: function(event) {
        // Trigger event when text changes in the "Name" textfield.
        // Call RangeQueryController.validateName() function
        MongoApp.vent.trigger("validateName", this.rangeQuery);
    }

});

