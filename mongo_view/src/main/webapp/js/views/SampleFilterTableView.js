SampleFilterTableView = Backbone.Marionette.CompositeView.extend({

    itemView: SampleFilterRowView,

    emptyView: SampleFilterTableEmptyView,

    // specify a jQuery selector to put the itemView instances in to
    itemViewContainer: "tbody",

    template: "#sample-filter-table-template",

    /**
     * Customize how the ItemView is built by passing along the following option:
     *
     * metadataFields - a {@link SampleMetadataFieldList} used to construct the field dropdown
     *
     * @param item
     * @param ItemViewType
     * @param itemViewOptions
     * @returns {ItemViewType}
     */
    buildItemView: function(item, ItemViewType, itemViewOptions){

        // include metadataFields in the final list of options for the item view type
        var options = _.extend(
            {
                model: item,
                metadataFields:    this.options.metadataFields,
                samplesAllList:    this.options.samplesAllList,
                typeAheadFunction: this.options.typeAheadFunction
            }, itemViewOptions );

        // create the item view instance
        // This creates and initializes the SampleFilterRowView object and passes in the options
        var view = new ItemViewType(options);

        // return it
        return view;
    }
});