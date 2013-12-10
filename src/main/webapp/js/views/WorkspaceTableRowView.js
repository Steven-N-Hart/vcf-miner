/**
 *
 * @type {*}
 */
var WorkspaceTableRowView = Backbone.View.extend({

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
        var workspace = this.model;

        // remove element with corresponding ID from DOM
        var id = workspace.get("id");
        var nRow =  $('#workspace_table tbody tr[id='+id+']')[0];

        var dataTable = $('#workspace_table').dataTable();
        dataTable.fnUpdate( this.toAaDataRow(workspace), nRow );
        dataTable.fnDraw();
    },

    /**
     * Translates the given workspace model object into an aaDataRow expected by the DataTables widget.
     *
     * @param workspace
     */
    toAaDataRow: function(workspace)
    {
        var id = workspace.get("id");
        var actionHtml;
        switch(workspace.get("status"))
        {
            case ReadyStatus.READY:
                actionHtml = '<div style="white-space:nowrap;">' +
                    '<button id="'+id+'_load_button" title="Load" type="button" class="btn btn-mini"><i class="icon-play"></i></button>' +
                    '<button id="'+id+'_delete_button" title="Delete" type="button" class="btn btn-mini"><i class="icon-remove"></i></button>' +
                    '</div>';

                break;
            case ReadyStatus.FAILED:
                actionHtml =
                    '<button id="'+id+'_delete_button" title="Delete" type="button" class="btn btn-mini"><i class="icon-remove"></i></button>';
                break;
            default:
                actionHtml = '';
        }

        var aaDataRow =
        {
            "DT_RowId": workspace.get("id"),
            "0": workspace.get("alias"),
            "1": this.getDisplayStatus(workspace),
            "2": workspace.get("date"),
            "3": actionHtml
        };

        return aaDataRow;
    },

    /**
     * Gets human readable display status for the given workspace.
     *
     * @param workspace
     * @returns {string}
     */
    getDisplayStatus: function(workspace)
    {
        switch(workspace.get("status"))
        {
            case ReadyStatus.NOT_READY:
                return "Importing";
            case ReadyStatus.READY:
                return "Available";
            case ReadyStatus.FAILED:
                return "Failed";
            default:
                return "NA";
        }
    }
});