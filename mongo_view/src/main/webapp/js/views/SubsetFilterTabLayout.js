/**
 * Layout that allows the user to create a subset.
 *
 * @type {*}
 */
SubsetFilterTabLayout = Backbone.Marionette.Layout.extend({

    template: "#subset-tab-layout-template",

    regions: {
        filtersRegion: "#sampleFiltersRegion",
        samplesRegion: "#sampleSelectionRegion"
    },

    /**
     * Maps UI elements by their jQuery selectors
     */
    ui: {
    },

    events: {
    },

    /**
     * Called when the view is first created
     */
    initialize: function(options) {

        this.sampleFilterLayout = new SampleFilterLayout({
            metadataFields:    options.metadataFields,
            sampleFilters:     options.filterSteps,
            samplesAllList:    options.samplesAllList,
            typeAheadFunction: options.typeAheadFunction
        });

        this.sampleSelectionLayout = options.sampleSelectionLayout;
    },

    onShow: function() {
        this.filtersRegion.show(this.sampleFilterLayout);
        this.samplesRegion.show(this.sampleSelectionLayout);
    }
});