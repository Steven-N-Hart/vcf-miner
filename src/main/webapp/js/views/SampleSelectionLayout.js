/**
 * Sub-layout that shows the subset's selected samples.
 * @type {*}
 */
SampleSelectionLayout = Backbone.Marionette.Layout.extend({

    template: "#sample-selection-layout-template",

    SAMPLES_TABLE_ID : "#samplesTable",

    /**
     * Collection of {@link Sample} models to be rendered.  This will be a subset of all samples based on the filter criteria.
     * NOTE: NULL initially because this is passed in through the constructor options
     */
    sampleList: null,

    /** Point to the div within the "subset-samples-layout-template" in the index.html where we will insert the Samples table */
    regions: {
        samplesTableRegion: "#samplesTableRegion"
    },

    /**
     * Maps UI elements by their jQuery selectors
     */
    ui: {
    },

    events: {
    },

    /**
     * Called when the view is first created
     */
    initialize: function(options) {

        this.sampleList = options.samples;

        //this.sampleSelectionTableView = new SampleSelectionTableView({
        //    collection:        options.samples
        //});


    },


    // Get the sample field names to display in the header of the table
    getHeader: function() {
        var headerRow = new Array();
        // loop through the first sample and pull out the header names
        if( this.options.samples.models.length > 0 ) {
            // Add "Sample Name" as first cell in header
            //headerRow.push( { "sTitle":  "Sample Name" } );
            headerRow.push( { "title":  "Sample Name" } );

            // Loop through all field names and add those
            var sample1 = this.options.samples.models[0];
            var keyValPairs = sample1.attributes.sampleMetadataFieldKeyValuePairs;
            for(var key in keyValPairs) {
                var val = keyValPairs[key];
                //headerRow.push( { "sTitle":  key } );
                headerRow.push( { "title":  key } );
            }
        }
        return headerRow;
    },

    getValuesAsCommaSeparatedString: function(valuesArray) {
        var valuesStr = "";
        for(var j=0; j < valuesArray.length; j++ ) {
            var val = valuesArray[j];
            var SEPARATOR = ", ";
            if (j < 1)
                SEPARATOR = "";
            valuesStr += SEPARATOR + val;
        }
        return valuesStr;
    },

    /** Get the data (sample name and field values) to display in the body of the table
    *   Resulting data will look like this:
    *      data : [ "row1-col1", "row1-col2", "row1-col3" ], [ "row2-col1", "row2-col2", "ro2-col3" ] ]
    */
    getData: function() {
        // Loop through all samples, to add the data
        var data = new Array();
        for(var  i=0; i < this.options.samples.models.length; i++ ) {
            var dataRow = new Array();
            var sample = this.options.samples.models[i].attributes;
            dataRow.push(sample.name);
            // For all fields (each field is a key/value pair), add the value (the key should be in the header already)
            for( var key in sample.sampleMetadataFieldKeyValuePairs) {
                var valuesStr = this.getValuesAsCommaSeparatedString(sample.sampleMetadataFieldKeyValuePairs[key]);
                dataRow.push( valuesStr );
            }
            data.push(dataRow);
        }
        return data;
    },


    showDataTable: function() {
        var headerRow = this.getHeader();
        var data = this.getData();

        var sDom =
            "<'row't>" +
            "<'row'<'pull-left'p><'pull-right'i>>";

        // How to add a checkbox column:
        //   http://editor.datatables.net/examples/api/checkbox.html
        //   http://www.datatables.net/blog/2014-09-09


        //this.dataTable = this.ui.table.dataTable( {
        this.dataTable = $(this.SAMPLES_TABLE_ID).dataTable( {
            "dom":       sDom,
            "columns":   headerRow,
            "data":      data,
            //"aoColumns": headerRow,
            //'aaData':    data,
            "bDestroy":  true,
            "iDisplayLength": 25,
            "aLengthMenu": [[10, 25, 50, 100, 500, 1000, -1],[10, 25, 50, 100, 500, 1000, 'All']],
            "bAutoWidth": false,
            "bScrollCollapse": true
//            "fnHeaderCallback": function( nHead, aData, iStart, iEnd, aiDisplay ) {
//                // set tooltip 'title' attribute for all TH elements that correspond to visible columns
//                var colIdx = 0;
//                _.each(self.options.columns.getVisibleColumns().models, function(col) {
//                    $('th:eq('+ colIdx +')', nHead).attr('title', col.get("description"));
//                    colIdx++;
//                });
//            }
        });
    },

    onShow: function() {
        //this.samplesTableRegion.show(this.sampleSelectionTableView);
        //$('#samplesTable').dataTable();
        this.showDataTable();
    },

    /** When the sampleList data changes, then refresh the data within the table
     *  See: http://stackoverflow.com/questions/12934144/how-to-reload-refresh-jquery-datatable
     **/
    refreshTableData: function() {
        var table = $(this.SAMPLES_TABLE_ID).dataTable();

        // Clear out the existing table data
        table.fnClearTable(this);

        // Add the new data to the table
        var data = this.getData();
        var oSettings = table.fnSettings();
        for (var i = 0; i < data.length; i++) {
            table.oApi._fnAddData(oSettings, data[i]);
        }

        // Redraw the table
        oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
        table.fnDraw();
    }


});
