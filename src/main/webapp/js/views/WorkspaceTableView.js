WorkspaceTableView = Backbone.Marionette.CompositeView.extend({

    itemView: WorkspaceTableRowView,

    // specify a jQuery selector to put the itemView instances in to
    itemViewContainer: "tbody",

    template: "#workspace-table-template",

    /**
     * Triggered after the view has been rendered.
     */
    onRender: function () {
        // initialize the DataTable widget
        var sDom = "<'row't>";

        this.$el.find('table').dataTable( {
            "sDom": sDom,
            'aaData': [],
            "iDisplayLength": 25,
            "bAutoWidth": false,
            "bScrollCollapse": true
        });
    }
});