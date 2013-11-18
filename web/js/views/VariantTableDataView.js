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
        "click .expand-array"  :  "expandArray",
        "click .expand-string" :  "expandString",
        "click .collapse"      :  "collapse",
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
            "<'row'<'pull-right'<'toolbar'>>>" +
                "<'row'<'pull-left'l><'pull-right'i>>" +
                "<'row't>" +
                "<'row'<'pull-left'p>>";

        var that = this;
        var dataTable = this.$('#variant_table').dataTable( {
            "sDom": sDom,
            "aoColumns": aoColumns,
            'aaData':    [],
            "bDestroy":  true,
            "iDisplayLength": 25,
            "bAutoWidth": true,
            "sScrollX": "100%",
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
     * Expands the cell from showing only the 1ST array entry to showing
     * each array item on a separate line.
     *
     * @param e
     *      jQuery event
     */
    expandArray: function(e)
    {
        var anchor = $(e.currentTarget);
        var rowID = anchor.attr('data-row-id');
        var colID = anchor.attr('data-col-id');

        var variantTableRow = this.model.findWhere({id: rowID});
        var value = variantTableRow.get("values")[colID];

        var displayValue = '';

        // expansion has each array item separated by whitespace
        var moreText = ''
        for (var i = 0; i < value.length; i++)
        {
            moreText += value[i] + '<br>';
        }

        var collapseAnchorHTML = '<a class="collapse" data-row-id="' + rowID + '" data-col-id="' + colID + '">collapse</a>';

        var display = ' <div>' + moreText + ' ' + collapseAnchorHTML + '</div>';

        // update cell
        var trElement = anchor.parents('tr')[0]; // find ancestor <TR> element that contains the anchor
        this.$('#variant_table').dataTable().fnUpdate(display, trElement, colID, false);
        this.$('#variant_table').dataTable().fnStandingRedraw()
    },

    /**
     * Expands the cell from showing only the 1ST X chacaters to showing all the
     * characters as a collapsing link.
     *
     * @param e
     *      jQuery event
     */
    expandString: function(e)
    {
        var anchor = $(e.currentTarget);
        var rowID = anchor.attr('data-row-id');
        var colID = anchor.attr('data-col-id');

        var variantTableRow = this.model.findWhere({id: rowID});
        var value = variantTableRow.get("values")[colID];

        var collapseAnchorHTML = '<a class="collapse" data-row-id="' + rowID + '" data-col-id="' + colID + '">'+value+'</a>';

        // update cell
        var trElement = anchor.parents('tr')[0]; // find ancestor <TR> element that contains the anchor
        this.$('#variant_table').dataTable().fnUpdate(collapseAnchorHTML, trElement, colID, false);
        this.$('#variant_table').dataTable().fnStandingRedraw()
    },

    /**
     * Collapses the expanded cell.
     *
     * @param e
     *      The jQuery event
     */
    collapse: function(e)
    {
        var anchor = $(e.currentTarget);
        var rowID = anchor.attr('data-row-id');
        var colID = anchor.attr('data-col-id');

        var variantTableRow = this.model.findWhere({id: rowID});
        var value = variantTableRow.get("values")[colID];

        var p = anchor.parent();
        var display = this.getDisplayValue(variantTableRow, colID);

        // update cell
        var trElement = anchor.parents('tr')[0]; // find ancestor <TR> element that contains the anchor
        this.$('#variant_table').dataTable().fnUpdate(display, trElement, colID, false);
        this.$('#variant_table').dataTable().fnStandingRedraw()
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
            if (value.length > 0)
            {
                displayValue = value[0];
            }
            if (value.length > 1)
            {
                var left = value.length - 1;
                var expandAnchor = '<a class="expand-array" data-row-id="' + rowID + '" data-col-id="' + colID + '" title="Show remaining '+ left +'">...</a>';
                displayValue += expandAnchor;
            }
        }
        else
        {
            var MAX_LENGTH = 15;
            if (value.length > MAX_LENGTH)
            {
                var expandAnchor = '<a class="expand-string" data-row-id="' + rowID + '" data-col-id="' + colID + '" title="Show remaining characters">...</a>';
                displayValue = '<div>' + value.substr(0, MAX_LENGTH) + expandAnchor + "</div>";
            }
            else
            {
                displayValue = value;
            }
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

        // add attribute returnFields
        var returnFields = new Array();
        _.each(this.getVisibleColumns().models, function(visibleCol)
        {
            returnFields.push(visibleCol.get("name"));
        });
        query.returnFields = returnFields;

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