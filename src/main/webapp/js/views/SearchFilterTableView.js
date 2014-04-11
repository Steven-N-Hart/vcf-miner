SearchFilterTableView = Backbone.Marionette.CompositeView.extend({

    itemView: SearchFilterRowView,

    // specify a jQuery selector to put the itemView instances in to
    itemViewContainer: "tbody",

    template: "#search-filter-table-template"
});