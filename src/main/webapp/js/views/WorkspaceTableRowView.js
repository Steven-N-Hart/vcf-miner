WorkspaceTableRowView = Backbone.Marionette.ItemView.extend({

    /**
     * Override to default implementation
     *
     * @returns {*}
     */
    render: function() {
        var workspace = this.model;

        $('#workspace_table').dataTable().fnAddData(this.toAaDataRow(workspace));

        // register event listeners
        $(document).on('click', '#' + workspace.get("id") + '_load_button', function() {
            console.debug("User selected workspace: " + workspace.get("key"));
            MongoApp.vent.trigger(MongoApp.events.WKSP_LOAD, workspace);
        });

        $(document).on('click', '#' + workspace.get("id") + '_delete_button', function() {
            var confirmDialog = new ConfirmDialog(
                "Delete VCF File",
                "Delete " + workspace.get('alias') + "?",
                "Delete",
                function() {
                    MongoApp.vent.trigger(MongoApp.events.WKSP_REMOVE, workspace);
                }
            );
            confirmDialog.show();
        });
        return this;
    },

    /**
     * Run custom code for your view that is fired after your view has been closed and cleaned up.
     */
    onClose: function(workspace)
    {
        var workspace = this.model;

        // Removes one row from the DataTables widget.
        var id = workspace.get("id");
        var nRow =  $('#workspace_table tbody tr[id='+id+']')[0];
        $('#workspace_table').dataTable().fnDeleteRow( nRow, null, true );
    },

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options) {
        this.listenTo(this.model, 'change', this.updateRow);
    },

    /**
     * Updates the row in the DataTable widget.
     *
     * @returns {*}
     */
    updateRow: function() {
        var workspace = this.model;

        // remove element with corresponding ID from DOM
        var id = workspace.get("id");
        var nRow =  $('#workspace_table tbody tr[id='+id+']')[0];

        $('#workspace_table').dataTable().fnUpdate( this.toAaDataRow(workspace), nRow );
    },

    /**
     * Translates the given workspace model object into an aaDataRow expected by the DataTables widget.
     *
     * @param workspace
     */
    toAaDataRow: function(workspace) {
        var id = workspace.get("id");
        var actionHtml;
        var loadButtonHtml = '<button id="'+id+'_load_button" class="btn" aria-hidden="true">Load</button>';
        var deleteButtonHtml = '<button id="'+id+'_delete_button" class="btn" aria-hidden="true">Delete</button>';
        switch(workspace.get("status")) {
            case ReadyStatus.READY:
                actionHtml = '<div style="white-space:nowrap;">' + loadButtonHtml + deleteButtonHtml + '</div>';
                break;
            case ReadyStatus.FAILED:
                actionHtml = deleteButtonHtml;
                break;
            default:
                actionHtml = '';
        }

        var alias = workspace.get("alias");
        var aliasHtml = "<div class='ellipsis' title='"+alias+"'>"+alias+"</div>";

        var aaDataRow = {
            "DT_RowId": workspace.get("id"),
            "0": aliasHtml,
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
    getDisplayStatus: function(workspace) {
        switch(workspace.get("status")) {
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