/**
 * Created with IntelliJ IDEA.
 * User: duffp
 * Date: 6/24/13
 * Time: 9:21 AM
 * To change this template use File | Settings | File Templates.
 */

// GLOBAL: templates for showing messages to user in designated message area
var INFO_TEMPLATE;
var WARNING_TEMPLATE;
var ERROR_TEMPLATE;

// GLOBAL: contains the column names to display
var DISPLAY_COLS;

// GLOBAL:
var MAX_RESULTS = 1000;

// GLOBAL:
var CURRENT_WORKSPACE_KEY;

// MODEL
var Filter = Backbone.Model.extend({
    defaults: function()
    {
        return {
            name:     "NA",
            operator: "NA",
            value:    "NA",
            numMatches: 0,
            id: guid()
        };
    }
});

// specific filters
var FILTER_NONE            = new Filter();
var FILTER_MIN_ALT_READS   = new Filter();
var FILTER_MIN_NUM_SAMPLES = new Filter();
var FILTER_MAX_NUM_SAMPLES = new Filter();
var FILTER_MIN_AC          = new Filter();
var FILTER_MAX_AC          = new Filter();
var FILTER_MIN_PHRED       = new Filter();

FILTER_NONE.set(           {name: 'none',          operator: '',  value: '', id:'id-none'});
FILTER_MIN_ALT_READS.set(  {name: 'Min Alt Reads', operator: '=', value: '0'});
FILTER_MIN_NUM_SAMPLES.set({name: 'Min # Samples', operator: '=', value: '0'});
FILTER_MAX_NUM_SAMPLES.set({name: 'Max # Samples', operator: '=', value: '0'});
FILTER_MIN_AC.set(         {name: 'Min AC',        operator: '=', value: '0'});
FILTER_MAX_AC.set(         {name: 'Max AC',        operator: '=', value: '0'});
FILTER_MIN_PHRED.set(      {name: 'Min Phred',     operator: '=', value: '0'});

// COLLECTION of Filters
var FilterList = Backbone.Collection.extend({
    model: Filter,
    localStorage: new Backbone.LocalStorage("todos-backbone"),
    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },
    comparator: 'order'
});

var SEARCHED_FILTER_LIST = new FilterList;
var PALLET_FILTER_LIST = new FilterList;

$( document ).ready(function()
{
    initTemplates();

    // TODO: user hardcoded to 'steve'
    // get workspace information from server
    var workspaceRequest = $.ajax({
        url: "/mongo_svr/ve/q/owner/list_workspaces/steve",
        dataType: "json",
        success: function(json)
        {
            // each workspace object has an increment num as the attr name
            for (var attr in json) {
                if (json.hasOwnProperty(attr)) {
                    var key = json[attr].key;
                    var alias = json[attr].alias;

                    var vcfList = $('#vcf_list');

                    // id of anchor in dropdown is the workspace key
                    vcfList.append("<option value='"+key+"'>"+alias+"</option>");

                    // user must select a VCF
                    $('#select_vcf_modal').modal({"keyboard":false});
                }
            }
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });

    backboneSearchedView();
    backbonePalletView();
});

/**
 * Initializes the underscorejs templates.
 */
function initTemplates()
{
    INFO_TEMPLATE    = $("#warning-message-template").html();
    WARNING_TEMPLATE = $("#warning-message-template").html();
    ERROR_TEMPLATE   = $("#error-message-template").html();
}

/**
 * Builds a query object.
 *
 * @param filterList Backbone collection of filter models.
 * @param workspaceKey
 * @returns {Object} Query object
 */
function buildQuery(filterList, workspaceKey)
{
    // build query from FILTER model
    var query = new Object();
    query.numberResults = MAX_RESULTS;

    query.workspace = workspaceKey;

    // loop through filter collection
    _.each(filterList.models, function(filter)
    {
        // assign filter value to correct query object attribute
        switch (filter.get("name"))
        {
            case FILTER_MIN_ALT_READS.get("name"):
                query.minAltReads = filter.get("value");
                break;
            case FILTER_MIN_NUM_SAMPLES.get("name"):
                query.minNumSample = filter.get("value");
                break;
            case FILTER_MAX_NUM_SAMPLES.get("name"):
                query.maxNumSample = filter.get("value");
                break;
            case FILTER_MIN_AC.get("name"):
                query.minAC = filter.get("value");
                break;
            case FILTER_MAX_AC.get("name"):
                query.maxAC = filter.get("value");
                break;
            case FILTER_MIN_PHRED.get("name"):
                query.minPHRED = filter.get("value");
                break;
        }
    });

    return query;
}

/**
 * Sends query to server via AJAX.
 *
 * @param query
 */
function sendQuery(query)
{
    var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h3>Running Query.  Please wait...</h3></div><div class="modal-body"></div></div>');
    pleaseWaitDiv.modal();

    console.debug("Sending query to server:" + JSON.stringify(query));

    var req = $.ajax({
        type: "POST",
        url: "/mongo_svr/ve/eq",
        contentType: "application/json",
        data: JSON.stringify(query),
        dataType: "json",
        success: function(json)
        {
            if (typeof json.mongoQuery !== "undefined")
            {
                console.debug("Mongo Query: " + json.mongoQuery);
            }

            // populate the variant table
            addRowsToVariantTable(json.results, DISPLAY_COLS);

            // update count on Filter
            // loop through filter collection
            var lastFilter = _.last(SEARCHED_FILTER_LIST.models);
            lastFilter.set("numMatches", json.totalResults);

            if (json.totalResults > MAX_RESULTS)
            {
                var m = 'Loaded only ' + MAX_RESULTS + ' out of ' + json.totalResults + " entries.";
                $("#message_area").html(_.template(WARNING_TEMPLATE,{message: m}));
            }
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        },
        complete: function(jqXHR, textStatus)
        {
            pleaseWaitDiv.modal('hide');
        }
    });
}

/**
 * Displays dialog box so that user can add a new filter.
 */
function addNewFilter()
{
    var addFilterDiv = $('#add_filter_modal');

    //var table = document.getElementById('add_filter_table');

    $('#add_filter_tabs a').click(function (e)
    {
        e.preventDefault();
        $(this).tab('show');
    })
    // display
    addFilterDiv.modal();
}

/**
 *
 * @param filterID
 */
function uncheckFilter(filterID)
{
    var checkbox = $('#' + filterID + "_add_button");

    // enable
    checkbox.prop( "disabled", false );

    // click to uncheck
    checkbox.click();
}

function setRemoveFilterButtonVisibility()
{
    var lastFilter = _.last(SEARCHED_FILTER_LIST.models);

    // loop through filter collection
    // remove button should ONLY be visible if it's
    // 1.) not the NONE filter
    // 2.) is the last filter in the list
    _.each(SEARCHED_FILTER_LIST.models, function(filter)
    {
        var button =  $("#" + filter.get("id") + "_remove_button");
        if ((filter.get("id") != FILTER_NONE.get("id")) &&
            (filter.get("id") == lastFilter.get("id")))
        {
            button.toggle(true);
        }
        else
        {
            button.toggle(false);
        }
    });
}

function backboneSearchedView()
{
    // VIEW
    var SearchedFilterView = Backbone.View.extend({

        tagName: "tr",

        template: _.template($('#searched-filter-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
            // set id
            $(this.el).attr('id', this.model.get("id"));

            this.$el.html(this.template(this.model.toJSON()));

            setRemoveFilterButtonVisibility();

            return this;
        },

        clear: function() {
            this.model.destroy();
        }
    });

    var SearchedView = Backbone.View.extend({
        el: $("#searched_view"),

        initialize: function() {

            this.listenTo(SEARCHED_FILTER_LIST, 'add',    this.addOne);
            this.listenTo(SEARCHED_FILTER_LIST, 'remove', this.removeOne);

            SEARCHED_FILTER_LIST.fetch();
        },

        render: function() {
        },

        addOne: function(filter) {
            // send query request to server
            var query = buildQuery(SEARCHED_FILTER_LIST, CURRENT_WORKSPACE_KEY);
            sendQuery(query);

            var view = new SearchedFilterView({model: filter});

            // add right before the Add Filter button row
            this.$("#add_filter_row").before(view.render().el);
        },

        removeOne: function(filter) {
            // send query request to server
            var query = buildQuery(SEARCHED_FILTER_LIST, CURRENT_WORKSPACE_KEY);
            sendQuery(query);

            // remove TR with corresponding filter ID from DOM
            this.$("#" + filter.get("id")).remove();

            setRemoveFilterButtonVisibility();
        }
    });

    var searchedView = new SearchedView();
}

function backbonePalletView()
{
    // VIEW
    var PalletFilterView = Backbone.View.extend({
        tagName:  "tr",

        template: _.template($('#pallet-filter-template').html()),

        initialize: function() {
        },

        render: function() {
            var filter = this.model;
            this.$el.html(this.template(filter.toJSON()));

            var selector = '#' + filter.get("id") + "_add_button";
            $('body').on('click', selector, function()
            {
                var checkbox = $(this);
                var textfieldSelector =  "#" + filter.get("id") + "_value_field";
                if (checkbox.is(':checked'))
                {
                    // disable checkbox, we want to control the order they can remove
                    // filters via the remove button
                    checkbox.prop( "disabled", true );

                    // use 'live query' plugin to select dynamically added textfield
                    $(textfieldSelector).livequery(
                        function()
                        {
                            var textfield = this;
                            textfield.disabled = true;

                            // update filter's value based on textfield value
                            filter.set("value", textfield.value);

                            // update query with modified filter
                            SEARCHED_FILTER_LIST.add([filter]);

                            //$('').click();
                            $("#add_filter_close").click();
                        }
                    );
                }
                else
                {
                    // use 'live query' plugin to select dynamically added textfield
                    $(textfieldSelector).livequery(
                        function()
                        {
                            var textfield = this;
                            textfield.disabled = false;

                            var filterIdx = SEARCHED_FILTER_LIST.indexOf(filter);
                            console.debug("Filter index: " + filterIdx);

                            console.debug("Removing filter with id: " + filter.get("id"));
                            SEARCHED_FILTER_LIST.remove(filter);
                        }
                    );
                }
            });

            return this;
        },

        clear: function() {
            this.model.destroy();
        }
    });

    var PalletView = Backbone.View.extend({
        el: $("#pallet_view"),

        initialize: function() {

            this.listenTo(PALLET_FILTER_LIST, 'add', this.addOne);

            PALLET_FILTER_LIST.fetch();
        },

        render: function() {
            // TODO: understand why this can't be in global space
            PALLET_FILTER_LIST.add([
                FILTER_MIN_ALT_READS,
                FILTER_MIN_NUM_SAMPLES,
                FILTER_MAX_NUM_SAMPLES,
                FILTER_MIN_AC,
                FILTER_MAX_AC,
                FILTER_MIN_PHRED
            ]);

            // loop through filter collection
            _.each(PALLET_FILTER_LIST.models, function(filter)
            {
                // each filter becomes a row in the table
                var view = new PalletFilterView({model: filter});
                this.$("#sample_filter_table").append(view.render().el);
            });
        },

        addOne: function(filter) {
        }
    });

    var palletView = new PalletView();
    palletView.render();
}

/**
 * Adds a row to the INFO Filter table.
 *
 * @param name The name of the INFO field.
 * @param type The type of the INFO field.
 */
function addRowToInfoFilterTable(name, type)
{
    var infoFilterTable = document.getElementById('info_filter_table');

    //insert a new row at the bottom
    var newRow = infoFilterTable.insertRow(infoFilterTable.rows.length);

    //create new cells
    var newCell1 = newRow.insertCell(0);
    var newCell2 = newRow.insertCell(1);
    var newCell3 = newRow.insertCell(2);

//    var rowHTML;
////    rowHTML = "<label for='"<%=id%>_add_button" class="checkbox"><input id="<%=id%>_add_button" type="checkbox"/><%=name%></label>";
    //set the cell text
    newCell1.innerHTML = "<button title='Add to your search' type=\"button\" class=\"btn-mini\"><i class=\"icon-plus\"></i></button>";
    newCell2.innerHTML = name;

    if (type === 'Flag')
    {
        newCell3.innerHTML = "<input class=\"input-mini\" type=\"checkbox\" checked=\"true\" name=\"min_alt_reads\"/>";
    }
    else if ((type === 'Integer') || (type === 'Float'))
    {
        var defaultTextValue;
        if (type === 'Integer')
            defaultTextValue = '0';
        else
            defaultTextValue = '0.0';

        newCell3.innerHTML =
            "<table><tr>"
                + "<td><select style='width:50px;' tabindex='1'>"
                + "<option value='eq'>=</option>"
                + "<option value='gt'>&gt;</option>"
                + "<option value='gteq'>&gt;=</option>"
                + "<option value='lt'>&lt;</option>"
                + "<option value='lteq'>&lt;=</option>"
                + "</select></td>"
                + "<td><input class=\"input-mini\" type=\"text\" value='"+defaultTextValue+"' name=\"min_alt_reads\"/></td>"
                +"</tr></table>";
    }
    else
    {
        newCell3.innerHTML = "<input class=\"input-mini\" type=\"text\" name=\"min_alt_reads\"/>";
    }
}

/**
 * Initializes the DataTable widget for variants.
 *
 * @param displayCols An array of strings, each representing the column title.
 */
function initVariantTable(displayCols)
{
    var aoColumns = new Array();
    for (var i = 0; i < DISPLAY_COLS.length; i++)
    {
        aoColumns.push({ "sTitle":   DISPLAY_COLS[i] });
    }

    $('#variant_table').dataTable( {
        "sDom": "<'row'<'span6'l><'span6'>r>t<'row'<'span6'i><'span6'p>>",
        "aoColumns": aoColumns,
        'aaData':    [],
        "bDestroy":  true
    });

    // set visibility
    for (var i = 0; i < DISPLAY_COLS.length; i++)
    {
        var isVisible = false;

        // only 1st 7 columns visible by default
        if (i <= 6)
        {
            isVisible = true;
        }

        $('#variant_table').dataTable().fnSetColumnVis(i, isVisible);
    }
}

/**
 * Adds 0 or more rows to the Variant Table.
 *
 * @param variants An array of variant objects.  Each is rendered as a single DataTable row.
 * @param displayCols An array of strings, each representing the column title.
 */
function addRowsToVariantTable(variants, displayCols)
{
    var aaData = new Array();

    for (var i = 0; i < variants.length; i++)
    {
        var variant = variants[i];

        var aaDataRow = new Array();
        aaDataRow.push(variant['CHROM']);
        aaDataRow.push(variant['POS']);
        aaDataRow.push(variant['ID']);
        aaDataRow.push(variant['REF']);
        aaDataRow.push(variant['ALT']);
        aaDataRow.push(variant['QUAL']);
        aaDataRow.push(variant['FILTER']);
        var variantInfo = variant['INFO'];
        for (var disIdx=7; disIdx < displayCols.length; disIdx++)
        {
            var infoFieldName = displayCols[disIdx];

            if(variantInfo[infoFieldName] !== undefined)
            {
                aaDataRow.push(variantInfo[infoFieldName]);
            }
            else
            {
                aaDataRow.push("");
            }
        }

        aaData.push(aaDataRow);
    }

    var table = $('#variant_table').dataTable();

    // update DataTable
    table.fnClearTable();
    table.fnAddData(aaData);

    // resize to fill browser nicely
    table.width("100%");
}

/**
 * Shows or hides Variant Table column.
 *
 * @param colName name of column to toggle visibility
 */
function toggleDisplayColumn(colName)
{
    // translate column name to column index
    for (i=0; i < DISPLAY_COLS.length; i++)
    {
        if (DISPLAY_COLS[i] == colName)
        {
            var colIdx = i;
            var table = $('#variant_table').dataTable();
            var isVisible = table.fnSettings().aoColumns[colIdx].bVisible;

            // flip visibility
            table.fnSetColumnVis(colIdx, !isVisible);

            // resize columns
            table.width("100%");

            return;
        }
    }

}

/**
 * Add a row to the Config Columns Table.
 *
 * @param checked
 * @param key
 * @param description
 */
function addRowToConfigColumnsTable(checked, key, description)
{
    var table = document.getElementById('config_columns_table');

    //insert a new row at the bottom
    var newCTableRow = table.insertRow(table.rows.length);

    //create new cells
    var newCTableCell1 = newCTableRow.insertCell(0);
    var newCTableCell2 = newCTableRow.insertCell(1);
    var newCTableCell3 = newCTableRow.insertCell(2);

    //set the cell text
    if (checked)
        newCTableCell1.innerHTML = "<input class=\"input-mini\" type=\"checkbox\" checked=\"true\" onclick=\"toggleDisplayColumn('"+key+"')\"/>";
    else
        newCTableCell1.innerHTML = "<input class=\"input-mini\" type=\"checkbox\" onclick=\"toggleDisplayColumn('"+key+"')\"/>";

    newCTableCell2.innerHTML = key;
    newCTableCell3.innerHTML = description;
}

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
/**
 * Generates a GUID.
 * @returns {string}
 */
function guid() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function setWorkspace()
{
    var workspaceKey   = $('#vcf_list').val();
    var workspaceAlias = $('#vcf_list option:selected').text();

    console.debug("User selected workspace: " + workspaceKey);
    CURRENT_WORKSPACE_KEY = workspaceKey;

    $("#vcf_file").html("VCF File: " + workspaceAlias);

    var metadataRequest = $.ajax({
        url: "/mongo_svr/ve/meta/workspace/" + workspaceKey,
        dataType: "json",
        success: function(json)
        {
            // clear tables
            $('#config_columns_table').empty();
            $('#info_filter_table').empty();

            // 1ST 7 VCF columns displayed by default
            DISPLAY_COLS = new Array();
            DISPLAY_COLS.push("CHROM");
            DISPLAY_COLS.push("POS");
            DISPLAY_COLS.push("ID");
            DISPLAY_COLS.push("REF");
            DISPLAY_COLS.push("ALT");
            DISPLAY_COLS.push("QUAL");
            DISPLAY_COLS.push("FILTER");

            addRowToConfigColumnsTable(true, "CHROM",  "The chromosome.");
            addRowToConfigColumnsTable(true, "POS",    "The reference position, with the 1st base having position 1.");
            addRowToConfigColumnsTable(true, "ID",     "Semi-colon separated list of unique identifiers.");
            addRowToConfigColumnsTable(true, "REF",    "The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).");
            addRowToConfigColumnsTable(true, "ALT",    "Comma separated list of alternate non-reference alleles called on at least one of the samples");
            addRowToConfigColumnsTable(true, "QUAL",   "Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).");
            addRowToConfigColumnsTable(true, "FILTER", "PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.");

            var info = json.INFO;
            for (var key in info)
            {
                if (info.hasOwnProperty(key))
                {
                    DISPLAY_COLS.push(key);

                    addRowToInfoFilterTable(key, info[key].type);

                    addRowToConfigColumnsTable(false, key, info[key].Description);
                }
            }

            // rebuild the DataTables widget since columns have changed
            initVariantTable(DISPLAY_COLS);
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });

    metadataRequest.done(function(msg)
    {
        // backbone MVC will send query request based on adding this filter
        SEARCHED_FILTER_LIST.reset();
        SEARCHED_FILTER_LIST.add(FILTER_NONE);
    });
}