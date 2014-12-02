/**
 * Allows the user to dynamically add sample filters.
 * @type {*}
 */
SampleFilterLayout = Backbone.Marionette.Layout.extend({

    template: "#sample-filters-layout-template",

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
            countFunction:     options.countFunction,
            valuesFunction:    options.valuesFunction,
            typeAheadFunction: options.typeAheadFunction
        });
    },

    onShow: function() {
        this.filterTableRegion.show(this.filterTableView);
    },

    /**
     * Add Filter button event
     *  NOTE: This triggers a call to the function "addFilter" in SubsetController
     */
    addFilterClicked: function() {
        MongoApp.vent.trigger("addFilter");
    },

    /**
     * Apply button event
     *  NOTE: This triggers a call to the function "applyFilters" in SubsetController
     */
    applyClicked: function() {
        MongoApp.vent.trigger("applyFilters");
    }
});