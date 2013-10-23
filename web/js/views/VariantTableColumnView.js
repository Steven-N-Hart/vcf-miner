var VariantTableColumnView = function (variantTableCols) {

    // private variables
    var view;

    var TableView = Backbone.View.extend({
        initialize: function()
        {
            this.listenTo(variantTableCols, 'change', this.hasChanged);
        },

        hasChanged: function(variantTableCol)
        {
            var colName = variantTableCol.get("displayName");

            var table = $('#variant_table').dataTable();
            var aoColumns = table.fnSettings().aoColumns;

            // translate column name to DataTables column
            for (i=0; i < aoColumns.length; i++)
            {
                if (aoColumns[i].sTitle == colName)
                {
                    table.fnSetColumnVis(i, variantTableCol.get("visible"));
                    return;
                }
            }
        }

    });

    view = new TableView();

    // PUBLIC API
    return {
    };

};