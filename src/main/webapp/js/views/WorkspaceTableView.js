/**
 *
 * @type {*}
 */
var WorkspaceTableView = Backbone.View.extend({

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     * custom option: fnSetWorkspaceCallback
     *      Function callback that takes a Workspace as a parameter.  This function is called
     *      when the user changes the workspace.     */
    initialize: function(options)
    {
        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, "add",        this.addRow);
        this.listenTo(this.model, 'remove',     this.removeRow);
        this.listenTo(this.model, "reset",      this.clearRows);

        this.render();
    },

    /**
     * Delegated events
     */
    events:
    {
        "click #import_workspace_button" : "download"
    },

    render: function()
    {
        // remove previous table if present
        this.$el.empty();

        // construct a new HTML table and add to DOM
        var table = $('<table>').attr(
            {
                "id":           'workspace_table',
                "class":        'table table-striped table-bordered',
                "border":       '0',
                "cellpadding":  '0',
                "cellspacing":  '0'
            });
        this.$el.append(table);

        var aoColumns = new Array();
        aoColumns.push({"sTitle" : "VCF File"});
        aoColumns.push({"sTitle" : "Status"});
        aoColumns.push({"sTitle" : "Date"});
        aoColumns.push({"sTitle" : ""});

        var sDom = "<'row't>";

        var that = this;
        var dataTable = this.$('#workspace_table').dataTable( {
            "sDom": sDom,
            "aoColumns": aoColumns,
            'aaData':    [],
            "bDestroy":  true,
            "iDisplayLength": 25,
            "bAutoWidth": false,
            "bScrollCollapse": true
//            ,
//            "fnHeaderCallback": function( nHead, aData, iStart, iEnd, aiDisplay )
//            {
//                // set tooltip 'title' attribute for all TH elements that correspond to visible columns
//                var colIdx = 0;
//                _.each(that.getVisibleColumns().models, function(col)
//                {
//                    $('th:eq('+ colIdx +')', nHead).attr('title', col.get("description"));
//                    colIdx++;
//                });
//
//            }
        });
    },

    /**
     * Adds one row to the DataTables widget.
     *
     * @param workspace
     */
    addRow: function(workspace)
    {
        var view = new WorkspaceTableRowView(
            {
                model: workspace,
                "fnDeleteWorkspaceCallback": this.options.fnDeleteWorkspaceCallback
            }
        );
        var aaDataRow = view.toAaDataRow(workspace);

        var aaData = new Array();
        aaData.push(aaDataRow);

        // register event listeners
        var that = this;
        $(document).on('click', '#' + workspace.get("id") + '_load_button', function()
        {
            that.options.fnSetWorkspaceCallback(workspace);
        });
        $(document).on('click', '#' + workspace.get("id") + '_delete_button', function()
        {
            that.options.fnDeleteWorkspaceCallback(workspace);
        });

        var dataTable = this.$('#workspace_table').dataTable();

        dataTable.fnAddData(aaData, false);

        // sort by the date column descending
        dataTable.fnSort( [ [2,'desc'] ]);

        dataTable.fnDraw();
    },

    /**
     * Removes one row from the DataTables widget.
     *
     * @param workspace
     */
    removeRow: function(workspace)
    {
        // remove element with corresponding ID from DOM
        var id = workspace.get("id");
        var nRow =  $('#workspace_table tbody tr[id='+id+']')[0];
        this.$('#workspace_table').dataTable().fnDeleteRow( nRow, null, true );
    },

    /**
     * Clears the DataTables widget of data.
     */
    clearRows: function()
    {
        this.$('#workspace_table').dataTable().fnClearTable();
    }
});