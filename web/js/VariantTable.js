var VariantTable = function (searchFilters) {

    // private variables
    var workspaceKey;
    var tableColumns = new VariantTableColumnList();
    var view;

    // delegated event listener since the toolbar is added dynamically to a DataTable
    $(document).on('click', '#export_button', function()
    {
        download();
    });

    var TableView = Backbone.View.extend({
        initialize: function()
        {
            this.listenTo(tableColumns, 'change', this.hasChanged);
        },

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

    view = new TableView();

    /**
     * Marks up obj with HTML to get a nice looking display value for a single DataTables cell.
     *
     * @param obj
     */
    function getDataTablesDisplayValue(value)
    {
        var id = guid();

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
                var expandAnchor = '<a id="' + id + '_expand" title="Show remaining '+ left +'">...</a>';
                var collapseAnchor = '<a id="' + id + '_collapse">collapse</a>';

                displayValue += expandAnchor;

                // expansion has each array item separated by whitespace
                var moreText = ''
                for (var i = 1; i < value.length; i++)
                {
                    moreText += value[i] + ' ';
                }

                $('body').on('click', '#' + id + '_expand',
                    function()
                    {
                        $(this).replaceWith(' <div>' + moreText + ' ' + collapseAnchor + '</div>');

                        $('body').on('click', '#' + id + '_collapse',
                            function()
                            {
                                // replace div with original expand anchor
                                $(this).parent().replaceWith(expandAnchor);
                            }
                        );

                    }
                );
            }
        }
        else
        {
            var MAX_LENGTH = 15;
            if (value.length > MAX_LENGTH)
            {
                var expandAnchor = '<a id="' + id + '_expand" title="Show remaining characters">...</a>';
                var collapseAnchor = '<a id="' + id + '_collapse">'+value+'</a>';

                displayValue = '<div>' + value.substr(0, MAX_LENGTH) + expandAnchor + "</div>";

                var remainingText = value.substr(MAX_LENGTH);

                $('body').on('click', '#' + id + '_expand',
                    function()
                    {
                        $(this).parent().replaceWith('<div>' + collapseAnchor + '</div>');

                        $('body').on('click', '#' + id + '_collapse',
                            function()
                            {
                                // replace div with original expand anchor
                                $(this).parent().replaceWith(displayValue);
                            }
                        );
                    }
                );
            }
            else
            {
                displayValue = value;
            }
        }

        return displayValue;
    }

    function reset(columns)
    {
        tableColumns.reset();
        // loop through filter collection
        _.each(columns.models, function(column)
        {
            tableColumns.add(column);
        });

        var table = $('<table>').attr(
            {
                "id":           'variant_table',
                "class":        'table table-striped table-bordered',
                "border":       '0',
                "cellpadding":  '0',
                "cellspacing":  '0'
            });

        // remove previous table if present
        $('#variant_table_div').empty();

        $('#variant_table_div').append(table);

        var aoColumns = new Array();
        // loop through collection
        _.each(tableColumns.models, function(displayCol)
        {
            aoColumns.push({ "sTitle":   displayCol.get("displayName") });
        });

        var sDom =
            "<'row'<'pull-right'<'toolbar'>>>" +
                "<'row'<'pull-left'l><'pull-right'i>>" +
                "<'row't>" +
                "<'row'<'pull-left'p>>";

        var dataTable = $('#variant_table').dataTable( {
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
                _.each(getVisibleColumns().models, function(column)
                {
                    $('th:eq('+ colIdx +')', nHead).attr('title', column.get("description"));
                    colIdx++;
                });

            }
        });

        var toolbar = $("#table_toolbar").clone();
        $("div .toolbar").append(toolbar);

        // set visibility
        var colIdx = 0;
        _.each(tableColumns.models, function(col)
        {
            var isVisible = col.get("visible");
            $('#variant_table').dataTable().fnSetColumnVis(colIdx++, isVisible);
        });
    }

    function getVisibleColumns()
    {
        var visibleCols = new VariantTableColumnList();
        _.each(tableColumns.models, function(col)
        {
            if (col.get("visible"))
            {
                visibleCols.add(col);
            }
        });
        return visibleCols;
    }

    /**
     * Downloads data in TSV format for the given query and selected columns.
     */
    function download()
    {
        // send query request to server
        var query = buildQuery(searchFilters, workspaceKey);

        // add attribute returnFields
        var returnFields = new Array();
        _.each(getVisibleColumns().models, function(visibleCol)
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
    }

    // public API
    return {
        /**
         * Resets the state of this tab.
         *
         * @param ws
         *      The workspace key.
         * @param columns
         *      VariantTableColumnList that controls what columns this table will have.
         */
        initialize: function(ws, columns)
        {
            workspaceKey = ws;
            reset(columns);
        },

        /**
         * Adds 0 or more rows to the Variant Table.
         *
         * @param variants An array of variant objects.  Each is rendered as a single DataTable row.
         */
        addRows: function(variants)
        {
            var aaData = new Array();

            for (var i = 0; i < variants.length; i++)
            {
                var variant = variants[i];

                var aaDataRow = new Array();

                // loop through collection
                _.each(tableColumns.models, function(col)
                {
                    var name = col.get("name");

                    if (name.substring(0, 4) === 'INFO')
                    {
                        // INFO column
                        var infoFieldName = col.get("displayName");
                        var variantInfo = variant['INFO'];
                        if(variantInfo[infoFieldName] !== undefined)
                        {
                            aaDataRow.push(getDataTablesDisplayValue(variantInfo[infoFieldName]));
                        }
                        else
                        {
                            aaDataRow.push("");
                        }
                    }
                    else
                    {
                        aaDataRow.push(getDataTablesDisplayValue(variant[name]));
                    }

                });

                aaData.push(aaDataRow);
            }

            var table = $('#variant_table').dataTable();

            // update DataTable
            table.fnClearTable();
            table.fnAddData(aaData);
        },

        /**
         * Shows or hides Variant Table column.
         *
         * @param id The id of the VariantTableColumn model
         */
        toggleDisplayColumn: function(id)
        {
            var col = tableColumns.findWhere({id: id});

            var table = $('#variant_table').dataTable();
            var aoColumns = table.fnSettings().aoColumns;

            // translate column name to DataTables column
            for (i=0; i < aoColumns.length; i++)
            {
                if (aoColumns[i].sTitle == col.get("displayName"))
                {
                    var isVisible = aoColumns[i].bVisible;

                    // flip visibility
                    isVisible = !isVisible;

                    col.set("visible", isVisible);
                    return;
                }
            }
        },

        /**
         * Gets ALL columns.
         *
         * @returns {VariantTableColumnList}
         */
        getAllColumns: function()
        {
            return tableColumns;
        },

        /**
         * Gets only columns currently visible.
         *
         * @returns {VariantTableColumnList}
         */
        getVisibleColumns: getVisibleColumns,

        /**
         * Adds a column to the table.
         *
         * @param name
         * @param displayName
         * @param description
         */
        addColumn: function(name, displayName, description)
        {
            // not visible by default
            var isVisible = false;

            tableColumns.add(new VariantTableColumn(
                {
                    visible:isVisible,
                    name:name,
                    displayName:displayName,
                    description:description
                }
            ));

        }
    };

};