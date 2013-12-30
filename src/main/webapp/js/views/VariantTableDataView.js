/**
 *
 * @type {*}
 */
var VariantTableDataView = Backbone.View.extend({

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     */
    initialize: function(options)
    {
        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, "add",        this.addRow);
        this.listenTo(this.model, "reset",      this.clearRows);
        this.listenTo(this.model, "finalize",   this.drawTable);
    },

    /**
     * Delegated events
     */
    events:
    {
        "click #export_button" :  "download",
        "click #columns_button":  "configColumns"
    },

    render: function()
    {
        // remove previous table if present
        this.$el.empty();

        // construct a new HTML table and add to DOM
        var table = $('<table>').attr(
            {
                "id":           'variant_table',
                "class":        'table table-striped table-bordered',
                "border":       '0',
                "cellpadding":  '0',
                "cellspacing":  '0'
            });
        this.$el.append(table);

        var aoColumns = new Array();
        // loop through collection
        _.each(this.options.columns.models, function(displayCol)
        {
            aoColumns.push(
                {
                    "sTitle":   displayCol.get("displayName"),
                    "bVisible": displayCol.get("visible")
                }
            );
        });

        var sDom =
            "<'row'<'pull-left'<'show'>><'pull-right'<'toolbar'>>>" +
                "R<'row'<'pull-left'l><'pull-right'i>>" +
                "<'row't>" +
                "<'row'<'pull-left'p>>";

        var that = this;
        var dataTable = this.$('#variant_table').dataTable( {
            "sDom": sDom,
            "aoColumns": aoColumns,
            'aaData':    [],
            "bDestroy":  true,
            "iDisplayLength": 25,
            "aLengthMenu": [[10, 25, 50, 100, 500, 1000, -1],[10, 25, 50, 100, 500, 1000, 'All']],
            "bAutoWidth": false,
            "bScrollCollapse": true,
            "fnHeaderCallback": function( nHead, aData, iStart, iEnd, aiDisplay )
            {
                // set tooltip 'title' attribute for all TH elements that correspond to visible columns
                var colIdx = 0;
                _.each(that.getVisibleColumns().models, function(col)
                {
                    $('th:eq('+ colIdx +')', nHead).attr('title', col.get("description"));
                    colIdx++;
                });

            }
        });

        var showButton = $('<button id="west-opener" title="Show Filters" type="button" class="showButton hide btn btn-mini"><i class="fa fa-arrow-right"></i> Show</button>');
        this.$('.show').append(showButton);
        $('#jquery-ui-container').layout().addOpenBtn("#west-opener", "west");

        var toolbar = $("#table_toolbar").clone();
        this.$('.toolbar').append(toolbar);
    },

    /**
     * Draws the DataTables widget.
     */
    drawTable: function()
    {
        this.$('#variant_table').dataTable().fnDraw();
    },

    /**
     * Adds one row to the DataTables widget.
     *
     * @param variantTableRow
     */
    addRow: function(variantTableRow)
    {
        var aaDataRow = new Array();
        var values = variantTableRow.get("values");
        for (var i = 0; i < values.length; i++)
        {
            aaDataRow.push(this.getDisplayValue(variantTableRow, i));
        }

        var aaData = new Array();
        aaData.push(aaDataRow);

        this.$('#variant_table').dataTable().fnAddData(aaData, false);
    },

    /**
     * Clears the DataTables widget of data.
     */
    clearRows: function()
    {
        this.$('#variant_table').dataTable().fnClearTable();
    },

    /**
     * Marks up obj with HTML to get a nice looking display value for a single DataTables cell.
     *
     * @param variantTableRow
     *      The VariantTableRow.
     * @param colID
     *      0-based column ID
     */
    getDisplayValue: function(variantTableRow, colID)
    {
        var rowID   = variantTableRow.get("id");
        var value   = variantTableRow.get("values")[colID];

        if (typeof value === "undefined")
        {
            return '';
        }

        var displayValue = '';

        if (value instanceof Array)
        {
            for (var i = 0; i < value.length; i++)
            {
                displayValue += value[i] + ' ';
            }
        }
        else
        {
            displayValue = value;
        }

        return displayValue;
    },

    /**
     * Gets the columns that are currently visible in the table.
     *
     * @returns {VariantTableColumnList}
     *      A collection of VariantTableColumn models that are visible in the table.
     */
    getVisibleColumns: function()
    {
        var visibleCols = new VariantTableColumnList();
        _.each(this.options.columns.models, function(col)
        {
            if (col.get("visible"))
            {
                visibleCols.add(col);
            }
        });
        return visibleCols;
    },

    /**
     * Downloads data in TSV format for the given query and selected columns.
     */
    download: function()
    {
        // send query request to server
        var query = buildQuery(this.options.filters, this.options.workspaceKey);

        var returnFields = new Array();
        var displayFields = new Array();
        _.each(this.getVisibleColumns().models, function(visibleCol)
        {
            returnFields.push(visibleCol.get("name"));
            displayFields.push(visibleCol.get("displayName"));
        });
        query.returnFields = returnFields;
        query.displayFields = displayFields;

        var displayFiltersApplied = new Array();
        _.each(this.options.filters.models, function(filter)
        {
            displayFiltersApplied.push(
                {
                    filterText: filter.get("name") + " " + filter.getOperatorAsASCII() + " " + filter.getValueAsASCII(),
                    numberVariantsRemaining: filter.get("numMatches")
                }
            );
        });
        query.displayFiltersApplied = displayFiltersApplied;

        var jsonStr = JSON.stringify(query)

        console.debug("Sending download request to server with the following JSON:" + jsonStr);

        // dynamically add HTML form that is hidden
        var form = $('<form>').attr(
            {
                id:      'export_form',
                method:  'POST',
                action:  '/mongo_svr/download',
                enctype: 'application/x-www-form-urlencoded'
            });
        var input = $('<input>').attr(
            {
                type: 'hidden',
                name: 'json',
                value: jsonStr
            });
        form.append(input);
        $("body").append(form);

        // programmatically submit form to perform download
        $('#export_form').submit();

        // remove form
        $('#export_form').remove();
    },

    /**
     * Configure table columns by showing dialog box.
     */
    configColumns: function()
    {
        var dialog = new VariantTableConfigColumnsView(
            {
                "el"    : $('#config_columns_table'),
                "model" : this.options.columns
            }
        );

        dialog.render();
    }
});