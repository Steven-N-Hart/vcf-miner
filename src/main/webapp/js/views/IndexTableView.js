/**
 *
 * @type {*}
 */
var IndexTableView = Backbone.View.extend({

    // unique ID
    table_uid: "",

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
        this.table_uid = "index_table_" + guid();

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
        "change .evt_create_idx" : "createIndex",
        "change .evt_delete_idx" : "deleteIndex"
    },

    render: function()
    {
        // remove previous table if present
        this.$el.empty();

        // construct a new HTML table and add to DOM
        var table = $('<table>').attr(
            {
                "id":           this.table_uid,
                "class":        'table table-striped table-bordered',
                "border":       '0',
                "cellpadding":  '0',
                "cellspacing":  '0'
            });
        this.$el.append(table);

        var aoColumns = new Array();
        aoColumns.push({"sTitle" : "Name"});
        aoColumns.push({"sTitle" : "Status"});
        aoColumns.push({"sTitle" : ""});

        var sDom = "<'row't>";

        var dataTable = this.$('#'+this.table_uid).dataTable( {
            "sDom": sDom,
            "aoColumns": aoColumns,
            'aaData':    [],
            "iDisplayLength": -1,
            "bAutoWidth": false,
            "bScrollCollapse": true,
            "bSort": this.options.sortable
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
                model: index,
                tableId: this.table_uid
            }
        );
        var aaDataRow = view.toAaDataRow(index);

        var aaData = new Array();
        aaData.push(aaDataRow);

        var dataTable = this.$('#'+this.table_uid).dataTable();

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
        this.$('#'+this.table_uid).dataTable().fnClearTable();
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

        // check for no-change
        if (index.get("status") == IndexStatus.READY)
        {
            return;
        }

        // disable radio buttons for the row
        $('#'+this.table_uid+' tbody tr[id='+fieldId+'] input[type=radio]').attr("disabled", "disabled");

        this.options.createIndexCallback(index.get("dataField"));
    },

    deleteIndex: function(e)
    {
        var offButton = $(e.currentTarget);
        var fieldId = offButton.attr('data-field-id');

        var index = this.findIndexModel(fieldId);

        // check for no-change
        if (index.get("status") == IndexStatus.NONE)
        {
            return;
        }

        // disable radio buttons for the row
        $('#'+this.table_uid+' tbody tr[id='+fieldId+'] input[type=radio]').attr("disabled", "disabled");

        var dropIndexCallback =  this.options.dropIndexCallback;
        var that = this;
        var confirmDialog = new ConfirmDialog(
            "Delete Index",
            "Delete index for column " + fieldId + "?",
            "Delete",
            function()
            {
                // confirm
                dropIndexCallback(index.get("dataField"));
            },
            function()
            {
                // cancel, need to toggle the radio button back to ON
                var onButton = $('input[type="radio"][data-field-id="'+fieldId+'"][value="on"]');

                // re-enable the radio buttons
                $('#'+that.table_uid+' tbody tr[id='+fieldId+'] input[type=radio]').removeAttr("disabled", "disabled");

                onButton.click();
            }
        );
        confirmDialog.show();
    }
});