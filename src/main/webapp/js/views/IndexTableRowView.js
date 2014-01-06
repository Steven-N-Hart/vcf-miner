/**
 *
 * @type {*}
 */
var IndexTableRowView = Backbone.View.extend({

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options)
    {
        this.listenTo(this.model, 'change', this.updateRow);
    },

    /**
     * Updates the row in the DataTable widget.
     *
     * @returns {*}
     */
    updateRow: function()
    {
        var index = this.model;

        // remove element with corresponding ID from DOM
        var id = index.get("dataField").get("id");
        var nRow =  $('#index_table tbody tr[id='+id+']')[0];

        var dataTable = $('#index_table').dataTable();
        dataTable.fnUpdate( this.toAaDataRow(index), nRow );
        dataTable.fnDraw();
    },

    /**
     * Translates the given DatabaseIndex model object into an aaDataRow expected by the DataTables widget.
     *
     * @param index
     */
    toAaDataRow: function(index)
    {
        var id = index.get("dataField").get("id");
        var name = index.get("dataField").get("id");

        var nameHtml = "<div class='ellipsis' title='"+name+"'>"+name+"</div>";
        var statusHtml = this.getDisplayStatus(index);
        var actionHtml = '';

        switch(index.get("status"))
        {
            case IndexStatus.NONE:
                actionHtml = '<button data-field-id="'+id+'" class="btn evt_create_idx" aria-hidden="true">Create</button>';
                break;
            case IndexStatus.READY:
                actionHtml = '<button data-field-id="'+id+'" class="btn evt_delete_idx" aria-hidden="true">Delete</button>';
                break;
            case IndexStatus.BUILDING:
                statusHtml += '<div class="progress"><div class="bar" style="width: '+index.get("progress")+'%;"></div></div>';
                break;
        }

        var aaDataRow =
        {
            "DT_RowId": id,
            "0": nameHtml,
            "1": statusHtml,
            "2": actionHtml
        };

        return aaDataRow;
    },

    /**
     * Gets human readable display status for the given index.
     *
     * @param workspace
     * @returns {string}
     */
    getDisplayStatus: function(index)
    {
        switch(index.get("status"))
        {
            case IndexStatus.NONE:
                return "No index";
            case IndexStatus.BUILDING:
                return "Building";
            case IndexStatus.DROPPING:
                return "Deleting";
            case IndexStatus.READY:
                return "Ready";
            default:
                return "";
        }
    }
});