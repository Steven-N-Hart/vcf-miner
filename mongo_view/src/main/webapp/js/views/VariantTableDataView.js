VariantTableDataView = Backbone.Marionette.Layout.extend({

    template: "#variant-table-template",

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     */
    initialize: function(options) {

        var self = this;
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_COMPLETE, function (fetchedVariantCnt, totalVariantCnt) {
            if (fetchedVariantCnt < totalVariantCnt) {
                var m = 'Loaded only the first ' +  fetchedVariantCnt + ' out of ' + totalVariantCnt;

                // Datatable's DIV with text "Showing X to Y of Z entries"
                var showingXtoYofZDiv = self.$el.find('.dataTables_info');
                showingXtoYofZDiv.prepend('<i class="fa fa-exclamation-triangle alert" style="padding:5px;display:inline"></i>');
                var triangleIcon = showingXtoYofZDiv.find('i');
                triangleIcon.popover('destroy');
                triangleIcon.popover(
                    {
                        html: true,
                        content: _.template($("#warning-popover-template").html(), {message: m}),
                        trigger: 'hover',
                        placement: 'bottom'
                    }
                );
                triangleIcon.popover('show');
                setTimeout(function(){ triangleIcon.popover('hide'); }, MongoApp.settings.popupDuration * 1000);
            }
        });

        // rebind so that options can be access in other functions
        this.options = options;

//        this.listenTo(this.model, "add",        this.addRow);
        this.listenTo(this.model, "reset",      this.clearRows);
        this.listenTo(this.model, "finalize",   this.drawTable);
    },

    /**
     * Delegated events
     */
    events: {
    },

    ui: {
        table: "table"
    },

    /**
     * Triggered after the view has been rendered, has been shown in the DOM via a Marionette.Region, and has been re-rendered.
     */
    onShow: function() {
        var self = this;

        var aoColumns = new Array();
        // loop through collection
        _.each(this.options.columns.models, function(displayCol) {
            aoColumns.push({
                "sTitle":   displayCol.get("displayName"),
                "bVisible": displayCol.get("visible")
            });
        });

        var sDom =
            "<'row'<'pull-left'<'show'>><'pull-right'<'toolbar'>>>" +
                "<'row'<'pull-left'l><'pull-right'i>>" +
                "<'row't>" +
                "<'row'<'pull-left'p>>";

        this.dataTable = this.ui.table.dataTable( {
            "dom": sDom,
            "aoColumns": aoColumns,
            'aaData':    [],
            "bDestroy":  true,
            "iDisplayLength": 25,
            "aLengthMenu": [[10, 25, 50, 100, 500, 1000, -1],[10, 25, 50, 100, 500, 1000, 'All']],
            "bAutoWidth": false,
            "bScrollCollapse": true,
            "fnHeaderCallback": function( nHead, aData, iStart, iEnd, aiDisplay ) {
                // set tooltip 'title' attribute for all TH elements that correspond to visible columns
                var colIdx = 0;
                _.each(self.options.columns.getVisibleColumns().models, function(col) {
                    $('th:eq('+ colIdx +')', nHead).attr('title', col.get("description"));
                    colIdx++;
                });

            }
        });

        this.dataTableReorder = new $.fn.dataTable.ColReorder( this.dataTable );
    },

    /**
     * Draws the DataTables widget.
     */
    drawTable: function() {

        var self = this;

        var order = this.getColumnOrderHash();

        var rows = new Array();
        _.each(this.model.models, function(variantTableRow) {
            var aaDataRow = new Array();

            for (var currentIdx = 0; currentIdx < order.length; currentIdx++) {
                var originalIdx = order[currentIdx];
                aaDataRow.push(self.getDisplayValue(variantTableRow, originalIdx));
            }

            rows.push(aaDataRow);
        });

        if (rows.length > 0) {
        this.dataTable.fnAddData(rows, false);
        }

        this.dataTable.fnDraw();
    },

    /**
     * Get the latest ordering of the columns as they may have been changed.
     *
     * @return A hash where:
     * <ul>
     * <li>array index : current column indexes left-to-right (0, 1, 2, 3, etc...)</li>
     * <li>array value : original column indexes before any re-ordering</li>
     * </ul>
     */
    getColumnOrderHash: function() {
        return this.dataTableReorder.fnOrder();
    },

//    /**
//     * Adds one row to the DataTables widget.
//     *
//     * @param variantTableRow
//     */
//    addRow: function(variantTableRow) {
//        var aaDataRow = new Array();
//        var values = variantTableRow.get("values");
//        for (var i = 0; i < values.length; i++) {
//            aaDataRow.push(this.getDisplayValue(variantTableRow, i));
//        }
//
//        this.dataTable.fnAddData(aaDataRow, false);
//    },

    /**
     * Clears the DataTables widget of data.
     */
    clearRows: function() {
        this.dataTable.fnClearTable();
    },

    /**
     * Marks up obj with HTML to get a nice looking display value for a single DataTables cell.
     *
     * @param variantTableRow
     *      The VariantTableRow.
     * @param colID
     *      0-based column ID
     */
    getDisplayValue: function(variantTableRow, colID) {
        var rowID   = variantTableRow.get("id");
        var value   = variantTableRow.get("values")[colID];

        if (typeof value === "undefined") {
            return '';
        }

        var displayValue = '';

        if (value instanceof Array) {
            for (var i = 0; i < value.length; i++) {
                displayValue += value[i] + ' ';
            }
        }
        else {
            displayValue = value;
        }

        return displayValue;
    }
});