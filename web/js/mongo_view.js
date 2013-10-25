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
var WARNING_POPOVER_TEMPLATE;
var ERROR_TEMPLATE;

// GLOBAL CONSTANT
var MAX_RESULTS = 1000;

// specific filters
var FILTER_NONE            = new Filter({name: 'none',          operator: FilterOperator.UNKNOWN, displayOperator: '',  value: '' , displayValue: '', id:'id-none'});
var FILTER_MIN_ALT_READS   = new Filter({name: 'Min Alt Reads', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE});
var FILTER_MIN_NUM_SAMPLES = new Filter({name: 'Min # Samples', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE});
var FILTER_MAX_NUM_SAMPLES = new Filter({name: 'Max # Samples', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE});
var FILTER_MIN_AC          = new Filter({name: 'Min AC',        operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE});
var FILTER_MAX_AC          = new Filter({name: 'Max AC',        operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE});
var FILTER_MIN_PHRED       = new Filter({name: 'Min Phred',     operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.SAMPLE});
var FILTER_GENE            = new Filter({name: 'Gene',          operator: FilterOperator.EQ, value: '' , displayValue: '0', category: FilterCategory.GENE});
var FILTER_GROUP           = new Filter({name: 'Group',         operator: FilterOperator.EQ, value: '' , displayValue: '0', category: FilterCategory.GROUP});

var SEARCHED_FILTER_LIST = new FilterList;
var PALLET_FILTER_LIST = new FilterList;

var INFO_FILTER_LIST = new FilterList;
var infoFilterTab;

var searchedView;

var VARIANT_TABLE_COLUMN_LIST = new VariantTableColumnList();
var configVariantTableView;
var variantTableColumnView;

var WORKSPACE_LIST = new WorkspaceList();
var workspacesView;

var SAMPLE_GROUP_LIST = new SampleGroupList();
var sampleGroupListView;

$( document ).ready(function()
{
    searchedView = new SearchedView(SEARCHED_FILTER_LIST);

    configVariantTableView = new ConfigVariantTableView(VARIANT_TABLE_COLUMN_LIST);
    variantTableColumnView = new VariantTableColumnView(VARIANT_TABLE_COLUMN_LIST);

    workspacesView = new WorkspacesView(WORKSPACE_LIST);

    sampleGroupListView = new SampleGroupListView(SAMPLE_GROUP_LIST);

    infoFilterTab = new InfoFilterTab(INFO_FILTER_LIST);

    initTemplates();

    getWorkspaces();

    // initialize the file input field
    $(":file").filestyle({buttonText: ''});
});

/**
 * Initializes the underscorejs templates.
 */
function initTemplates()
{
    INFO_TEMPLATE            = $("#warning-message-template").html();
    WARNING_TEMPLATE         = $("#warning-message-template").html();
    WARNING_POPOVER_TEMPLATE = $("#warning-popover-template").html();
    ERROR_TEMPLATE           = $("#error-message-template").html();
}

/**
 * Queries the server for available workspaces
 */
function getWorkspaces()
{
    // clear out workspaces
    WORKSPACE_LIST.reset();

    // TODO: users hardcoded - need authentication?
    var users = new Array();
    users.push('steve');
    users.push('dan');

    // perform REST call per-user
    for (var i = 0; i < users.length; i++)
    {
        var user = users[i];
        // get workspace information from server
        var workspaceRequest = $.ajax({
            url: "/mongo_svr/ve/q/owner/list_workspaces/" + user,
            dataType: "json",
            success: function(json)
            {
                // each workspace object has an increment num as the attr name
                for (var attr in json) {
                    if (json.hasOwnProperty(attr)) {
                        var ws = new Workspace();
                        ws.set("key",   json[attr].key);
                        ws.set("alias", json[attr].alias);
                        ws.set("user",  user);
                        ws.set("status", json[attr].ready);
                        WORKSPACE_LIST.add(ws);
                    }
                }
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }
}

/**
 * Looks at the filter's current values and tries to be smart about
 * how display value should look.
 *
 * @param filter
 */
function setFilterDisplay(filter)
{
    var value = filter.get("value");
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
    filter.set("displayValue", $.trim(displayValue));

    var displayOperator;
    switch(filter.get("operator"))
    {
        case FilterOperator.UNKNOWN:
            displayOperator='';
            break;
        case FilterOperator.EQ:
            displayOperator='=';
            break;
        case FilterOperator.GT:
            displayOperator='&gt;';
            break;
        case FilterOperator.GTEQ:
            displayOperator='&#x2265;';
            break;
        case FilterOperator.LT:
            displayOperator='&lt;';
            break;
        case FilterOperator.LTEQ:
            displayOperator = '&#x2264;';
            break;
        case FilterOperator.NE:
            displayOperator = '&#x2260;';
            break;
    }
    filter.set("displayOperator", displayOperator);
}

function initGroupTab(workspaceKey, allSampleNames)
{
    $('#remove_group_button').click(function (e)
    {
        var group = getSelectedGroup();

        SAMPLE_GROUP_LIST.remove(group);

        // tell server about removed sample group
        removeSampleGroup(workspaceKey, group);

        updateGroupDetailsPane();
    });

    var availableSamplesList = $('#available_samples_list');
    var groupSamplesList = $('#group_samples_list');

    $('#add_sample_to_group_button').click(function (e)
    {
        $('#available_samples_list option:selected').each(function()
        {
            var sampleName = $(this).val();
            groupSamplesList.append("<option>" + sampleName + "</option>");

            // remove option from available list
            $(this).remove();
        });
    });

    $('#remove_sample_from_group_button').click(function (e)
    {
        $('#group_samples_list option:selected').each(function()
        {
            var sampleName = $(this).val();
            availableSamplesList.append("<option value='"+sampleName+"'>" + sampleName + "</option>");

            // remove option from available list
            $(this).remove();
        });
    });

    $('#new_group_apply').click(function (e)
    {
        var group = new SampleGroup();
        group.set("name", $('#group_name_field').val());
        group.set("description", '');

        var sampleNames = $.map($('#group_samples_list option'), function(e) { return e.value; });
        group.set("sampleNames", sampleNames);

        updateGroupDetailsPane(group);
        SAMPLE_GROUP_LIST.add(group);
        saveSampleGroup(workspaceKey, group);

        // select last Group
        //$("#group_list option:last").attr("selected","selected");
    });

    $('#new_group_button').click(function (e)
    {
        // reset widgets
        $('#group_name_field').val('');
        availableSamplesList.empty();
        groupSamplesList.empty();

        for (var i=0; i < allSampleNames.length; i++)
        {
            var sampleName = allSampleNames[i];
            availableSamplesList.append("<option value='"+sampleName+"'>" + sampleName + "</option>");
        }

        // show dialog
        $('#create_group_modal').modal();
    });

    var groupList = $('#group_list');

    // selection in group list selection has changed or clicked on
    groupList.change(function()
    {
        groupList.popover('show');
        updateGroupDetailsPane(getSelectedGroup());
    });

    groupList.popover(
        {
            animation:  true,
            html:       true,
            placement: 'bottom',
            title:      getGroupPopoverTitle,
            content:    getGroupPopoverContent
        }
    );

    loadSampleGroups(workspaceKey);
}

function initSampleTab(sampleFilters)
{
    var sampleFieldList = $('#sample_field_list');
    sampleFieldList.empty();

    for (var i=0; i < sampleFilters.models.length; i++)
    {
        var filter = sampleFilters.models[i];

        sampleFieldList.append("<option value='"+filter.get("id")+"'>"+filter.get("name")+"</option>");

        sampleFieldList.change(function()
        {
            sampleFieldChanged();
        });

        // simulate user clicking on 1st entry
        sampleFieldChanged();
    }
}

function getGroupPopoverTitle()
{
    var numSamples = getSelectedGroup().get("sampleNames").length;
    var title =  'This group has <b>' + numSamples + '</b>';

    if (numSamples == 1)
    {
        title += " sample";
    } else
    {
        title += " samples";
    }

    return title + "<button type='button' id='close' class='close' onclick=\"$('#group_list').popover('hide');\">&times;</button>";
}

function getGroupPopoverContent()
{
    var group = getSelectedGroup();
    var html = "";

    html += "<select size='8'>";
    for (var i=0; i < group.get("sampleNames").length; i++)
    {
        html += "<option>" + group.get("sampleNames")[i] + "</option>";
    }
    html += "</select>";

    return html;
}

/**
 * Updates the details pane for the given SampleGroup model.
 * @param group
 */
function updateGroupDetailsPane(group)
{
    var div = $('#group_sample_div');
    var sampleCountLabel = $('#group_sample_list_count');
    var sampleList = $('#group_sample_list');

    if (typeof group === "undefined")
    {
        div.hide();
    }
    else
    {
        div.show();
        sampleCountLabel.text("Samples (" + group.get("sampleNames").length + ")");
        sampleList.empty();
        for (var i=0; i < group.get("sampleNames").length; i++)
        {
            sampleList.append("<option>" + group.get("sampleNames")[i] + "</option>");
        }
    }
}

/**
 * Gets the currently selected group.
 *
 * @returns selected SampleGroup model
 */
function getSelectedGroup()
{
    // get selected option from select
    var groupOption = $('#group_list option:selected');

    var id = groupOption.val();

    for (var i = 0; i < SAMPLE_GROUP_LIST.models.length; i++)
    {
        var group = SAMPLE_GROUP_LIST.models[i];
        if (id == group.get("id"))
        {
            console.debug("user selected group with id=" + id + " name=" + group.get("name"));
            return group;
        }
    }
}

function initGeneTab(workspaceKey)
{
    $('#reset_gene_list').click(function (e)
    {
        $('#gene_list').empty();
    });

    $.ajax({
        type: "GET",
        url: "/mongo_svr/ve/gene/getGenes/w/" + workspaceKey,
        dataType: "json",
        success: function(json)
        {
            $('#gene_typeahead').typeahead({
                source: json,
                updater: function (selection)
                {
                    $('#gene_list').append("<option value='"+selection+"'>"+selection+"</option>");
                }
            });
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
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

    var sampleGroups      = new Array();
    var infoFlagFilters = new Array();
    var infoNumberFilters = new Array();
    var infoStringFilters = new Array();

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
            case FILTER_GENE.get("name"):
                query.genes = filter.get("value");
                break;
            case FILTER_GROUP.get("name"):
                // lookup SampleGroup model that corresponds to name
                for (var i=0; i < SAMPLE_GROUP_LIST.models.length; i++)
                {
                    var group = SAMPLE_GROUP_LIST.models[i];
                    if (group.get("name") === FILTER_GROUP.get("value"))
                    {
                        sampleGroups.push(toSampleGroupPOJO(workspaceKey, group));
                    }
                }
                break;
        }

        switch (filter.get("category"))
        {
            case FilterCategory.INFO_FLAG:
                infoFlagFilters.push(toInfoFlagFilterPojo(filter));
                break;
            case FilterCategory.INFO_INT:
            case FilterCategory.INFO_FLOAT:
                infoNumberFilters.push(toInfoNumberFilterPojo(filter));
                break;
            case FilterCategory.INFO_STR:
                infoStringFilters.push(toInfoStringFilterPojo(filter));
                break;
        }
    });

    query.sampleGroups      = sampleGroups;
    //query.infoFlagFilters = infoFlagFilters; // TODO: enable this when server-side is there
    query.infoNumberFilters = infoNumberFilters;
    query.infoStringFilters = infoStringFilters;

    return query;
}

/**
 * Sends query to server via AJAX.
 *
 * @param query
 * @param displayCols
 */
function sendQuery(query, displayCols)
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
            addRowsToVariantTable(json.results, displayCols);

            // update count on Filter
            // loop through filter collection
            var lastFilter = _.last(SEARCHED_FILTER_LIST.models);
            lastFilter.set("numMatches", json.totalResults);

            if (json.totalResults > MAX_RESULTS)
            {
                var m = 'Loaded only ' + MAX_RESULTS;
                numMatchesLabel = $('#' + lastFilter.get("id") + "_num_matches_label");
                numMatchesLabel.popover(
                    {
                        html: true,
                        content: _.template(WARNING_POPOVER_TEMPLATE,{message: m})
                    }
                );
                numMatchesLabel.popover('show');
                // hide popover after 2 seconds
                setTimeout(
                    function(){numMatchesLabel.popover('hide');},
                    2000
                );
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
function showAddNewFilter()
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
 * Adds a filter to the collection of filters that are searched
 */
function addFilter()
{
    // determine ID of currently selected tab
    var tabId = $("ul#add_filter_tabs li.active > a").attr("href").split("#")[1];

    // construct filter object
    var filter;
    switch(tabId)
    {
        case "tab_content_sample":
            // get selected filter
            var filterID = $('#sample_field_list').val();
            filter = PALLET_FILTER_LIST.findWhere({id: filterID});
            // update filter's value based on textfield value
            filter.set("value", $("#sample_value_div input").val());
            break;

        case "tab_content_gene":
            var geneArray = new Array();
            $("#gene_list option").each(function()
            {
                var gene = $(this).val();
                geneArray.push(gene);
            });

            FILTER_GENE.set("value", geneArray);
            filter = FILTER_GENE;
            break;

        case "tab_content_group":
            var group = getSelectedGroup();
            FILTER_GROUP.set("value", group.get("name"));
            filter = FILTER_GROUP;
            break;

        case "tab_content_info":
            filter = infoFilterTab.getFilter();
            window.alert("INFO flag fields are not implemented yet on the server.")
            break;
    }

    setFilterDisplay(filter);
    SEARCHED_FILTER_LIST.add(filter);
    $("#add_filter_close").click();
}

/**
 * Removes filter from the collection of filters that are searched
 *
 * @param filterID
 */
function removeFilter(filterID)
{
    SEARCHED_FILTER_LIST.remove(SEARCHED_FILTER_LIST.findWhere({id: filterID}));
}

function toSampleGroupPOJO(workspaceKey, groupModel)
{
    var pojo = new Object();
    pojo.workspace   = workspaceKey;
    pojo.alias       = groupModel.get("name");
    pojo.description = groupModel.get("description");
    pojo.samples     = groupModel.get("sampleNames");
    pojo.inSample    = true; // TODO: pull this from UI
    return pojo;
}

function saveSampleGroup(workspaceKey, group)
{
    // translate backbone model to pojo expected by server
    var pojo = toSampleGroupPOJO(workspaceKey, group);

    console.debug("Saving group: " + JSON.stringify(pojo));

    $.ajax({
        type: "POST",
        url: "/mongo_svr/ve/samples/savegroup",
        contentType: "application/json",
        data: JSON.stringify(pojo),
        dataType: "json",
        success: function(json)
        {
            console.debug("saved group: " + pojo.alias);
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
}

function removeSampleGroup(workspaceKey, group)
{
    // translate backbone model to pojo expected by server
    var pojo = toSampleGroupPOJO(workspaceKey, group);

    $.ajax({
        type: "POST",
        url: "/mongo_svr/ve/samples/deletegroup",
        contentType: "application/json",
        data: JSON.stringify(pojo),
        dataType: "json",
        success: function(json)
        {
            console.debug("deleted group: " + pojo.alias);
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
}

function loadSampleGroups(workspaceKey)
{
    $.ajax({
        url: "/mongo_svr/ve/samples/groups/w/" + workspaceKey,
        dataType: "json",
        success: function(json)
        {
            var groupArray = json.sampleGroups;
            console.debug(json);
            console.debug("Number of groups: " + groupArray.length);
            for (var i = 0; i < groupArray.length; i++)
            {
                // translate to SampleGroup model
                var group = new SampleGroup();
                group.set("name",        groupArray[i].alias);
                group.set("description", groupArray[i].description);
                group.set("sampleNames", groupArray[i].samples);

                SAMPLE_GROUP_LIST.add(group);
            }
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
}

function sampleFieldChanged()
{
    // get selected filter
    var filterID = $('#sample_field_list').val();
    var filter = PALLET_FILTER_LIST.findWhere({id: filterID});

    // value DIV area
    var valueDiv = $("#sample_value_div");
    // clear div value area
    valueDiv.empty();

    valueDiv.append("<input class='input-mini' type='number' value='0'>");
}

/**
 * Initializes the DataTable widget for variants.
 *
 * @param workspaceKey
 * @param displayCols An array of VariantTableColumn models.
 */
function initVariantTable(workspaceKey, displayCols)
{
    var table = $('<table>').attr(
        {
            id:      'variant_table',
            class:   'table table-striped table-bordered',
            border:   '0',
            cellpadding: '0',
            cellspacing: '0'
        });

    // remove previous table if present
    $('#variant_table_div').empty();

    $('#variant_table_div').append(table);


    var aoColumns = new Array();
    // loop through collection
    _.each(displayCols.models, function(displayCol)
    {
        aoColumns.push({ "sTitle":   displayCol.get("displayName") });
    });

    var sDom =
        "<'row'<'pull-right'<'toolbar'>>>" +
        "<'row'<'pull-left'l><'pull-right'i>>" +
        "<'row't>" +
        "<'row'<'pull-left'p>>";

    $('#variant_table').dataTable( {
        "sDom": sDom,
        "aoColumns": aoColumns,
        'aaData':    [],
        "bDestroy":  true,
        "iDisplayLength": 50,
        "bAutoWidth": true,
        "sScrollX": "100%",
        "bScrollCollapse": true
    });


    var toolbar = $("#table_toolbar").clone();
    $("div .toolbar").append(toolbar);

    // init export button
    $('#export_button', toolbar).click(function (e)
    {
        download(workspaceKey, displayCols);
    });

    // set visibility
    var colIdx = 0;
    _.each(displayCols.models, function(displayCol)
    {
        var isVisible = displayCol.get("visible");
        $('#variant_table').dataTable().fnSetColumnVis(colIdx++, isVisible);
    });
}

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

/**
 * Adds 0 or more rows to the Variant Table.
 *
 * @param variants An array of variant objects.  Each is rendered as a single DataTable row.
 * @param displayCols An array of VariantTableColumn models.
 */
function addRowsToVariantTable(variants, displayCols)
{
    var aaData = new Array();

    for (var i = 0; i < variants.length; i++)
    {
        var variant = variants[i];

        var aaDataRow = new Array();

        // loop through collection
        _.each(displayCols.models, function(displayCol)
        {
            var name = displayCol.get("name");

            if (name.substring(0, 4) === 'INFO')
            {
                // INFO column
                var infoFieldName = displayCol.get("displayName");
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
}

/**
 * Shows or hides Variant Table column.
 *
 * @param id The id of the VariantTableColumn model
 */
function toggleDisplayColumn(id)
{
    var col = VARIANT_TABLE_COLUMN_LIST.findWhere({id: id});

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
}

function setWorkspace(workspaceKey)
{
    infoFilterTab.setWorkspace(workspaceKey);
    searchedView.setWorkspace(workspaceKey);

    // reset collections
    PALLET_FILTER_LIST.reset();
    INFO_FILTER_LIST.reset();
    SEARCHED_FILTER_LIST.reset();
    VARIANT_TABLE_COLUMN_LIST.reset();

    // update screens
    $("#getting_started").toggle(false);
    $("#jquery-ui-container").toggle(true);
    initWorkspaceScreen();

    // move workspaces pane from getting_started screen to workspace screen
    var workspacesPane = $("#workspaces_pane").detach();
    var placeholder = $("#workspaces_placeholder");
    placeholder.append(workspacesPane);

    var workspace = WORKSPACE_LIST.findWhere({key: workspaceKey});

    console.debug("User selected workspace: " + workspaceKey);

    $("#vcf_file").html("VCF File: " + workspace.get("alias"));

    // standard 1st 7 VCF file columns
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'CHROM',  displayName:'CHROM',  description:'The chromosome.'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'POS',    displayName:'POS',    description:'The reference position, with the 1st base having position 1.'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'ID',     displayName:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'REF',    displayName:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'ALT',    displayName:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:false, name:'QUAL',   displayName:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:false, name:'FILTER', displayName:'FILTER', description:'PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));

    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'GenotypePostitiveCount', displayName:'#_Samples', description:'The number of samples.'}));
    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn({visible:true,  name:'GenotypePositiveList',  displayName:'Samples',   description:'The names of samples.'}));

    PALLET_FILTER_LIST.add([
        FILTER_MIN_ALT_READS,
        FILTER_MIN_NUM_SAMPLES,
        FILTER_MAX_NUM_SAMPLES,
        FILTER_MIN_AC,
        FILTER_MAX_AC,
        FILTER_MIN_PHRED
    ]);

    var metadataRequest = $.ajax({
        url: "/mongo_svr/ve/meta/workspace/" + workspaceKey,
        dataType: "json",
        success: function(json)
        {
            var info = json.INFO;

            // delete the properties that are actually FORMAT fields, not INFO fields
            var shouldDelete = function(obj, propName)
            {
                var isFormatField = (obj[propName].EntryType == "FORMAT");
                if (isFormatField)
                {
                    console.debug("Ignoring field " + propName + " because it is of type FORMAT");
                }
                return isFormatField;
            }
            deleteObjectProperties(info, shouldDelete);

            // get the INFO field names sorted alphabetically
            var infoFieldNames = getSortedAttrNames(info);

            for (var i = 0; i < infoFieldNames.length; i++) {
                var infoFieldName = infoFieldNames[i];
                if (info.hasOwnProperty(infoFieldName))
                {
                    var isVisible = false; // TODO: dynamically set visibilty for SNPEFF columns
                    VARIANT_TABLE_COLUMN_LIST.add(new VariantTableColumn(
                        {
                            visible:isVisible,
                            name:'INFO.'+infoFieldName,
                            displayName:infoFieldName,
                            description:info[infoFieldName].Description
                        }
                    ));

                    var infoFilter = new Filter();
                    infoFilter.set("name", infoFieldName);

                    var category;
                    switch(info[infoFieldName].type)
                    {
                        case 'Flag':
                            category = FilterCategory.INFO_FLAG;
                            break;
                        case 'Integer':
                            category = FilterCategory.INFO_INT;
                            break;
                        case 'Float':
                            category = FilterCategory.INFO_FLOAT;
                            break;
                        default:
                            category = FilterCategory.INFO_STR;
                            break;
                    }
                    infoFilter.set("category", category);

                    INFO_FILTER_LIST.add(infoFilter);
                }
            }

            var allSamples = new Array();
            for (var key in json.SAMPLES)
            {
                if (json.SAMPLES.hasOwnProperty(key))
                {
                    allSamples.push(key);
                }
            }
            // sort alphabetically
            allSamples.sort(SortByName);

            // rebuild the DataTables widget since columns have changed
            initVariantTable(workspaceKey, VARIANT_TABLE_COLUMN_LIST);

            searchedView.setDisplayCols(VARIANT_TABLE_COLUMN_LIST);

            initGeneTab(workspaceKey);
            initGroupTab(workspaceKey, allSamples);
            initSampleTab(PALLET_FILTER_LIST);

            // backbone MVC will send query request based on adding this filter
            SEARCHED_FILTER_LIST.add(FILTER_NONE);
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
}

/**
 * Translates the given Filter model into a InfoFlagFilter server-side object.
 *
 * @param filter
 */
function toInfoFlagFilterPojo(filter)
{
    var pojo = new Object();

    pojo.key = "INFO." + filter.get("name");

    pojo.value = filter.get("value");

    var comparator;
    switch(filter.get("operator"))
    {
        case FilterOperator.EQ:
            comparator='';
            break;
        case FilterOperator.NE:
            comparator = '$ne';
            break;
    }
    pojo.comparator = comparator;

    return pojo;
}

/**
 * Translates the given Filter model into a InfoNumberFilter server-side object.
 *
 * @param filter
 */
function toInfoNumberFilterPojo(filter)
{
    var pojo = new Object();

    pojo.key = "INFO." + filter.get("name");

    pojo.value = filter.get("value");

    var comparator;
    switch(filter.get("operator"))
    {
        case FilterOperator.EQ:
            comparator='';
            break;
        case FilterOperator.GT:
            comparator='$gt';
            break;
        case FilterOperator.GTEQ:
            comparator='$gte';
            break;
        case FilterOperator.LT:
            comparator='$lt';
            break;
        case FilterOperator.LTEQ:
            comparator = '$lte';
            break;
        case FilterOperator.NE:
            comparator = '$ne';
            break;
    }
    pojo.comparator = comparator;

    return pojo;
}

/**
 * Translates the given Filter model into a InfoStringFilter server-side object.
 *
 * @param filter
 */
function toInfoStringFilterPojo(filter)
{
    var pojo = new Object();

    pojo.key = "INFO." + filter.get("name");

    var value = filter.get("value");
    var displayValue = '';

    if (value instanceof Array)
    {
        pojo.values = value;
    }
    else
    {
        var values = new Array();
        values.push(filter.get("value"));
        pojo.values = values;
    }

    var comparator;
    switch(filter.get("operator"))
    {
        case FilterOperator.EQ:
            comparator='$in';
            break;
        case FilterOperator.NE:
            comparator = '$ne';
            break;
    }
    pojo.comparator = comparator;

    return pojo;
}

/**
 * Uploads a VCF to the server to create a new workspace.
 */
function addWorkspace()
{
    $("#progress").css('width','0%');

    // TODO: hardcoded user
    var user = 'steve';

    var uploadFile = $( '#vcf_file_upload' )[0].files[0]

    // some browsers put C:\\fakepath\\ on the front
    var name = uploadFile.name.replace("C:\\fakepath\\", "");
    // chomp off trailing .vcf file extension
    name = name.split(".")[0];
    console.debug("Adding working with name=" + name);

    // progress on transfers from the server to the client (downloads)
    function updateProgress (oEvent)
    {
        if (oEvent.lengthComputable)
        {
            var percentComplete = (oEvent.loaded / oEvent.total) * 100;
            $("#progress").css('width',percentComplete + '%');
        }
    }

//    function transferComplete(evt)
//    {
//        alert("The transfer is complete.");
//    }

//    function transferFailed(evt)
//    {
//        alert("An error occurred while transferring the file.");
//    }

    var xhr = new XMLHttpRequest();
//
    xhr.upload.addEventListener("progress", updateProgress, false);
    //xhr.addEventListener("load", transferComplete, false);
    //xhr.addEventListener("error", transferFailed, false);

    xhr.open('POST', "/mongo_svr/uploadvcf/user/" + user + "/alias/" + name, true);

    xhr.onload = function(oEvent)
    {
        if (xhr.status == 200)
        {
            console.log("Uploaded!");

            $("#progress").css('width','100%');

            // refresh workspaces
            getWorkspaces();
        } else
        {
            console.log("Error " + xhr.status + " occurred uploading your file.<br \/>");
        }
        $('#upload_vcf_progress_modal').modal('hide');
    };

    var formData = new FormData;
    formData.append('file', uploadFile);
    xhr.send(formData);

    // hide
    $('#add_workspace_modal').modal('hide');

     // display
    $('#upload_vcf_progress_modal').modal();
}

function deleteWorkspace(workspaceKey)
{
    var workspace = WORKSPACE_LIST.findWhere({key: workspaceKey});

    console.debug("Deleting working with name=" + workspace.get("alias") + " and key=" + workspaceKey);

    $.ajax({
        type: "DELETE",
        url: "/mongo_svr/ve/delete_workspace/" + workspaceKey,
        success: function(json)
        {
            WORKSPACE_LIST.remove(workspace);
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
}

/**
 * Downloads data in TSV format for the given query and selected columns.
 *
 * @param workspaceKey
 * @param displayCols An array of VariantTableColumn models
 */
function download(workspaceKey, displayCols)
{
    // send query request to server
    var query = buildQuery(SEARCHED_FILTER_LIST, workspaceKey);

    // add attribute returnFields
    var returnFields = new Array();
    _.each(displayCols.models, function(displayCol)
    {
        if (displayCol.get("visible"))
        {
            returnFields.push(displayCol.get("name"));
        }
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