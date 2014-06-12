WorkspaceTableRowView = Backbone.Marionette.ItemView.extend({

    searches: new SearchList(),

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options) {
        this.listenTo(this.model, 'change', this.updateRow);

        this.table = options.table;

        // reference to DataTables wiget passed down from parent CollectionView
        this.dataTable = options.dataTable;
    },

    /**
     * Override to default implementation
     *
     * @returns {*}
     */
    render: function() {

        var workspace = this.model;

        this.dataTable.fnAddData(this.toAaDataRow(workspace));
    },

    /**
     * Run custom code for your view that is fired after your view has been closed and cleaned up.
     */
    onBeforeClose: function()
    {
        var workspace = this.model;

        // Removes one row from the DataTables widget.
        var id = workspace.get("id");
        var nRow =  this.table.find('tbody tr[id='+id+']')[0];
        this.dataTable.fnDeleteRow( nRow, null, true );
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
        var nRow =  this.table.find('tbody tr[id='+id+']')[0];

        this.dataTable.fnUpdate( this.toAaDataRow(workspace), nRow );
    },

    /**
     * Translates the given workspace model object into an aaDataRow expected by the DataTables widget.
     *
     * @param workspace
     */
    toAaDataRow: function(workspace) {
        var id = workspace.get("id");
        var actionHtml;

        var loadButtonHtml =
            '<div class="btn-group">' +
            '    <button data-wks-key="' + workspace.get("key") + '" class="btn analyze">Analyze</button>' +
            '    <button data-wks-key="' + workspace.get("key") + '" class="btn dropdown-toggle show-analyses" data-toggle="dropdown">' +
            '        <span class="caret"></span>' +
            '    </button>' +
            '    <ul class="dropdown-menu"></ul>' +
            '</div>';

        var deleteButtonHtml = '<button data-wks-key="' + workspace.get("key") + '" class="btn delete">Delete</button>';
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