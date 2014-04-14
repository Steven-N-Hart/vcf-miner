SearchTableView = Backbone.Marionette.CompositeView.extend({

    itemView: SearchTableRowView,

    // specify a jQuery selector to put the itemView instances in to
    itemViewContainer: "tbody",

    template: "#search-table-template"
});