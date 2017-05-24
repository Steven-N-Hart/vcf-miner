/**
 *
 * @type {*}
 */
var VariantTableColumnView = Backbone.View.extend({

    /**
     * Called when the view is first created
     */
    initialize: function()
    {
        this.listenTo(this.model, "change", this.hasChanged);
    },

    /**
     *
     *
     * @param variantTableCol
     */
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