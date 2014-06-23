VariantTableDataView = Backbone.Marionette.Layout.extend({

    template: "#variant-table-template",

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     */
    initialize: function(options) {
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
        "click #export_button" :  "download",
        "click #columns_button":  "configColumns"
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
                "R<'row'<'pull-left'l><'pull-right'i>>" +
                "<'row't>" +
                "<'row'<'pull-left'p>>";

        this.dataTable = this.ui.table.dataTable( {
            "sDom": sDom,
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

        this.drawTable();

        // dynamically add 'show' button to the <div> with class '.show'
        var showButton = $('<button id="west-opener" title="Show Search" type="button" class="hide btn btn-mini"><i class="fa fa-arrow-right"></i> Show</button>');
        this.$('.show').append(showButton);

        var toolbar = $("#table_toolbar").clone();
        this.$('.toolbar').append(toolbar);
    },

    /**
     * Draws the DataTables widget.
     */
    drawTable: function() {

        var self = this;

        var rows = new Array();
        _.each(this.model.models, function(variantTableRow) {
            var aaDataRow = new Array();
            var values = variantTableRow.get("values");
            for (var i = 0; i < values.length; i++) {
                aaDataRow.push(self.getDisplayValue(variantTableRow, i));
            }
            rows.push(aaDataRow);
        });

        this.dataTable.fnAddData(rows, false);

        this.dataTable.fnDraw();
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
    },

    /**
     * Configure table columns by showing dialog box.
     */
    configColumns: function() {
        var dialog = new VariantTableConfigColumnsView( {
                "el"    : $('#config_columns_table'),
                "model" : this.options.columns
            }
        );

        dialog.render();
    },

    download: function() {
        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_DOWNLOAD, MongoApp.workspace, MongoApp.search);
    }
});