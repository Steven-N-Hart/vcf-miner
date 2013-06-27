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
var displayCols = new Array();

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

var FILTER_NONE   = {name: 'none', operator: '', value: ''};

// specific filters
var FILTER_MIN_ALT_READS   = {name: 'Min Alt Reads', operator: '=', value: '0'};
var FILTER_MIN_NUM_SAMPLES = {name: 'Min # Samples', operator: '=', value: '0'};
var FILTER_MAX_NUM_SAMPLES = {name: 'Max # Samples', operator: '=', value: '0'};
var FILTER_MIN_AC          = {name: 'Min AC',        operator: '=', value: '0'};
var FILTER_MAX_AC          = {name: 'Max AC',        operator: '=', value: '0'};
var FILTER_MIN_PHRED       = {name: 'Min Phred',     operator: '=', value: '0'};

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

var searchedFilterList = new FilterList;
var palletFilterList = new FilterList;

$( document ).ready(function()
{
    initTemplates();

    // 1ST 7 VCF columns displayed by default
    displayCols.push("CHROM");
    displayCols.push("POS");
    displayCols.push("ID");
    displayCols.push("REF");
    displayCols.push("ALT");
    displayCols.push("QUAL");
    displayCols.push("FILTER");

    addRowToConfigColumnsTable(true, "CHROM",  "The chromosome.");
    addRowToConfigColumnsTable(true, "POS",    "The reference position, with the 1st base having position 1.");
    addRowToConfigColumnsTable(true, "ID",     "Semi-colon separated list of unique identifiers.");
    addRowToConfigColumnsTable(true, "REF",    "The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).");
    addRowToConfigColumnsTable(true, "ALT",    "Comma separated list of alternate non-reference alleles called on at least one of the samples");
    addRowToConfigColumnsTable(true, "QUAL",   "Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).");
    addRowToConfigColumnsTable(true, "FILTER", "PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.");

    backboneSetup();

    var metadataRequest = $.ajax({
        url: "/ve/meta/workspace/wf1c80c3721da2e536a53f16b4bc47aca7ef6e681", // TODO: hardcoded workspace
        dataType: "json",
        success: function(json)
        {
            var info = json.INFO;
            for (var key in info)
            {
                if (info.hasOwnProperty(key))
                {
                    displayCols.push(key);

                    addRowToInfoFilterTable(key, info[key].type);

                    addRowToConfigColumnsTable(false, key, info[key].Description);
                }
            }
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });

    metadataRequest.done(function(msg)
    {
        // setup the variant table
        initVariantTable(displayCols);

        var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h3>Running Query.  Please wait...</h3></div><div class="modal-body"></div></div>');
        pleaseWaitDiv.modal();

        // populate the variant table
        $.ajax({
            url: "/ve/q/wf1c80c3721da2e536a53f16b4bc47aca7ef6e681/page/99", // TODO: hardcoded query
            dataType: "json",
            success: function(json)
            {
                FILTER_NONE.numMatches=json.results.length;
                searchedFilterList.add(FILTER_NONE);
                addRowsToVariantTable(json.results, displayCols);
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
    });
});

/**
 * Initializes the underscorejs templates.
 */
function initTemplates()
{
    INFO_TEMPLATE = $("#warning-message-template").html();
    WARNING_TEMPLATE = $("#warning-message-template").html();
    ERROR_TEMPLATE   = $("#error-message-template").html();
}

/**
 * Builds a query object.
 *
 * @param filterList Backbone collection of filter models.
 * @returns {Object} Query object
 */
function buildQuery(filterList)
{
    // build query from FILTER model
    var query = new Object();
    query.numberResults = 100;

    // loop through filter collection
    _.each(filterList.models, function(filter)
    {
        // assign filter value to correct query object attribute
        switch (filter.get("name"))
        {
            case FILTER_MIN_ALT_READS.name:
                query.minAltReads = filter.get("value");
                break;
            case FILTER_MIN_NUM_SAMPLES.name:
                query.minNumSample = filter.get("value");
                break;
            case FILTER_MAX_NUM_SAMPLES.name:
                query.maxNumSample = filter.get("value");
                break;
            case FILTER_MIN_AC.name:
                query.minAC = filter.get("value");
                break;
            case FILTER_MAX_AC.name:
                query.maxAC = filter.get("value");
                break;
            case FILTER_MIN_PHRED.name:
                query.minPHED = filter.get("value");
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
    console.debug("Sending query to server:" + JSON.stringify(query));

    var req = $.ajax({
        type: "POST",
        url: "/ve/eq",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(query),
        dataType: "json",
        success: function(json)
        {
            // TODO: implement this
            //addRowsToVariantTable(json.results, displayCols);
        },
        error: function(jqXHR, textStatus)
        {
            alert( JSON.stringify(jqXHR) );
        }
    });
}

function backboneSetup()
{
    // VIEW
    var SearchedFilterView = Backbone.View.extend({
        tagName:  "tr",

        template: _.template($('#searched-filter-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        clear: function() {
            this.model.destroy();
        }
    });

    var SearchedView = Backbone.View.extend({
        el: $("#searched_view"),

        initialize: function() {

            this.listenTo(searchedFilterList, 'add',    this.addOne);
            this.listenTo(searchedFilterList, 'remove', this.removeOne);

            searchedFilterList.fetch();
        },

        render: function() {
            // remove all rows from table except for header
            this.$('tr:has(td)').remove();

            // loop through filter collection
            _.each(searchedFilterList.models, function(filter)
            {
                // each filter becomes a row in the table
                var view = new SearchedFilterView({model: filter});
                this.$("#searched_table").append(view.render().el);
            });
        },

        addOne: function(filter) {
            // send query request to server
            var query = buildQuery(searchedFilterList);
            sendQuery(query);

            this.render();
        },

        removeOne: function(filter) {
            // send query request to server
            var query = buildQuery(searchedFilterList);
            sendQuery(query);

            this.render();
        }
    });

    var searchedView = new SearchedView();

    // VIEW
    var PalletFilterView = Backbone.View.extend({
        tagName:  "tr",

        template: _.template($('#pallet-filter-template').html()),

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
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
                    // use 'live query' plugin to select dynamically added textfield
                    $(textfieldSelector).livequery(
                        function()
                        {
                            var textfield = this;

                            textfield.disabled = true;

                            // update filter's value based on textfield value
                            filter.set("value", textfield.value);

                            // update query with modified filter
                            searchedFilterList.add([filter]);
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

                            textfield.disabled =false;

                            searchedFilterList.remove(filter);
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

            this.listenTo(palletFilterList, 'add', this.addOne);

            palletFilterList.fetch();
        },

        render: function() {

            console.debug("PalletView.render() called");

            // TODO: understand why this can't be in global space
            palletFilterList.add([
                FILTER_MIN_ALT_READS,
                FILTER_MIN_NUM_SAMPLES,
                FILTER_MAX_NUM_SAMPLES,
                FILTER_MIN_AC,
                FILTER_MAX_AC,
                FILTER_MIN_PHRED
            ]);

            // loop through filter collection
            _.each(palletFilterList.models, function(filter)
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
    for (var i = 0; i < displayCols.length; i++)
    {
        var isVisible = false;

        // only 1st 7 columns visible by default
        if (i <= 6)
        {
            isVisible = true;
        }

        aoColumns.push(
            {
                "sTitle":   displayCols[i],
                "bVisible": isVisible
            }
        );
    }
    $('#variant_table').dataTable( {
        "aoColumns": aoColumns
    });
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

    // update DataTable
    $('#variant_table').dataTable().fnAddData(aaData);
}

/**
 * Shows or hides Variant Table columns based on the Config Columns table checkboxes.
 */
function toggleDisplayColumns()
{
    var oTable = $('#variant_table').dataTable();

    for (i=0; i < displayCols.length; i++)
    {
        // lookup checkbox widget (toggle_[displayCol])
        var checkbox = $('#toggle_'+displayCols[i]);
        if (checkbox.is(':checked'))
        {
            oTable.fnSetColumnVis( i, true);
        }
        else
        {
            oTable.fnSetColumnVis( i, false);
        }
    }

    // resize columns
    oTable.width("100%");

    // close dialog
    $("#column_dialog_close").click();
}

/**
 * Add a row to the Config Columns Table.
 *
 * @param table
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
        newCTableCell1.innerHTML = "<input class=\"input-mini\" type=\"checkbox\" checked=\"true\" id=\"toggle_"+key+"\"/>";
    else
        newCTableCell1.innerHTML = "<input class=\"input-mini\" type=\"checkbox\" id=\"toggle_"+key+"\"/>";

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