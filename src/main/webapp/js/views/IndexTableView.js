/**
 *
 * @type {*}
 */
var IndexTableView = Backbone.View.extend({

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
        this.listenTo(this.model, "reset",      this.clearRows);

        this.render();
    },

    /**
     * Delegated events
     */
    events:
    {
        "click .evt_create_idx" : "createIndex",
        "click .evt_delete_idx" : "deleteIndex"
    },

    render: function()
    {
        // remove previous table if present
        this.$el.empty();

        // construct a new HTML table and add to DOM
        var table = $('<table>').attr(
            {
                "id":           'index_table',
                "class":        'table table-striped table-bordered',
                "border":       '0',
                "cellpadding":  '0',
                "cellspacing":  '0'
            });
        this.$el.append(table);

        var aoColumns = new Array();
        aoColumns.push({"sTitle" : "Column"});
        aoColumns.push({"sTitle" : "Status"});
        aoColumns.push({"sTitle" : ""});

        var sDom = "<'row't>";

        var dataTable = this.$('#index_table').dataTable( {
            "sDom": sDom,
            "aoColumns": aoColumns,
            'aaData':    [],
            "iDisplayLength": -1,
            "bAutoWidth": false,
            "bScrollCollapse": true
        });
    },

    /**
     * Adds one row to the DataTables widget.
     *
     * @param index
     */
    addRow: function(index)
    {
        var view = new IndexTableRowView(
            {
                model: index
            }
        );
        var aaDataRow = view.toAaDataRow(index);

        var aaData = new Array();
        aaData.push(aaDataRow);

        var dataTable = this.$('#index_table').dataTable();

        dataTable.fnAddData(aaData, false);

        // sort by the name column ascending
//        dataTable.fnSort( [ [0,'asc'] ]);

        dataTable.fnDraw();
    },

    /**
     * Clears the DataTables widget of data.
     */
    clearRows: function()
    {
        this.$('#index_table').dataTable().fnClearTable();
    },

    /**
     * Searches through all models.
     *
     * @param fieldId
     * @returns {*}
     */
    findIndexModel: function(fieldId)
    {
        return _.find(this.model.models, function(index){
                if (index.get("dataField").get("id") == fieldId)
                    return index;
            }
        );
    },

    /**
     * Create a new index.
     *
     * @param e
     *      The jQuery event.
     *
     */
    createIndex: function(e)
    {
        var button = $(e.currentTarget);
        var fieldId = button.attr('data-field-id');
        var index = this.findIndexModel(fieldId);
        this.options.createIndexCallback(index.get("dataField"));
    },

    deleteIndex: function(e)
    {
        var button = $(e.currentTarget);
        var fieldId = button.attr('data-field-id');
        var index = this.findIndexModel(fieldId);

        var dropIndexCallback =  this.options.dropIndexCallback;
        var confirmDialog = new ConfirmDialog(
            "Delete Index",
            "Delete index for column " + fieldId + "?",
            "Delete",
            function()
            {
                dropIndexCallback(index.get("dataField"));
            }
        );
        confirmDialog.show();
    }
});