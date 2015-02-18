/**
 * Allows the user to dynamically add sample filters.
 * @type {*}
 */
SampleFilterLayout = Backbone.Marionette.Layout.extend({

    template: "#sample-filterSteps-layout-template",

    regions: {
        filterTableRegion: "#sampleFilterTableRegion"
    },

    /**
     * Maps UI elements by their jQuery selectors
     */
    ui: {
    },

    events: {
        "click .addFilter" : "addFilterClicked",
        "click .apply" : "applyClicked"
    },

    /**
     * Called when the view is first created
     */
    initialize: function(options) {

        this.filterTableView = new SampleFilterTableView({
            collection:        options.sampleFilters,
            metadataFields:    options.metadataFields,
            samplesAllList:    options.samplesAllList,
            typeAheadFunction: options.typeAheadFunction
        });
    },

    onShow: function() {
        this.filterTableRegion.show(this.filterTableView);
    },

    /**
     * Add Filter button event
     *  NOTE: This triggers a call to the function "addFilterStep" in SubsetController
     */
    addFilterClicked: function() {
        MongoApp.vent.trigger("addFilterComponentComponent");
    },

    /**
     * Apply button event
     *  NOTE: This triggers a call to the function "applyFilters" in SubsetController
     */
    applyClicked: function() {
        MongoApp.vent.trigger("applyFilters");
    }
});