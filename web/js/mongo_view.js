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

var SEARCHED_FILTER_LIST = new FilterList;
var PALLET_FILTER_LIST = new FilterList;

var INFO_FILTER_LIST = new FilterList;

var searchedView;

var VARIANT_TABLE_COLUMN_LIST = new VariantTableColumnList();
var configVariantTableView;
var variantTableColumnView;

var WORKSPACE_LIST = new WorkspaceList();
var workspacesView;

var SAMPLE_GROUP_LIST = new SampleGroupList();

var addFilterDialog;

$( document ).ready(function()
{
    searchedView = new SearchedView(SEARCHED_FILTER_LIST);

    configVariantTableView = new ConfigVariantTableView(VARIANT_TABLE_COLUMN_LIST);
    variantTableColumnView = new VariantTableColumnView(VARIANT_TABLE_COLUMN_LIST);

    workspacesView = new WorkspacesView(WORKSPACE_LIST);

    addFilterDialog = new AddFilterDialog(INFO_FILTER_LIST, SEARCHED_FILTER_LIST, SAMPLE_GROUP_LIST, PALLET_FILTER_LIST);
    $('#show_add_filter_dialog_button').click(function (e)
    {
        addFilterDialog.show();
    });

    initTemplates();

    loadWorkspaces(WORKSPACE_LIST);

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
 *
 * @param workspaces
 */
function loadWorkspaces(workspaces)
{
    // clear out workspaces
    workspaces.reset();

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
                        workspaces.add(ws);
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
 * Loads Sample Groups for the specified workspace.
 *
 * @param workspaceKey
 * @param sampleGroups
 */
function loadSampleGroups(workspaceKey, sampleGroups)
{
    sampleGroups.reset();

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

                sampleGroups.add(group);
            }
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
        switch (filter.get("category"))
        {
            case FilterCategory.INFO_FLAG:
                infoFlagFilters.push(filter.toInfoFlagFilterPojo());
                break;
            case FilterCategory.INFO_INT:
            case FilterCategory.INFO_FLOAT:
                infoNumberFilters.push(filter.toInfoNumberFilterPojo());
                break;
            case FilterCategory.INFO_STR:
                infoStringFilters.push(filter.toInfoStringFilterPojo());
                break;
            case FilterCategory.GROUP:
                // lookup SampleGroup model that corresponds to name
                var group = SAMPLE_GROUP_LIST.findWhere({name: filter.get("value")});
                var inSample;
                switch(filter.get("operator"))
                {
                    case FilterOperator.IN:
                        inSample = true;
                        break;
                    case FilterOperator.NOT_IN:
                        inSample = false;
                        break;
                }
                sampleGroups.push(group.toSampleGroupPOJO(workspaceKey, inSample));
                break;
            case FilterCategory.SAMPLE:
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
                break;
            case FilterCategory.GENE:
                query.genes = filter.get("value");
                break;
        }
    });

    query.sampleGroups      = sampleGroups;
    query.infoFlagFilters = infoFlagFilters;
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
 * Removes filter from the collection of filters that are searched
 *
 * @param filterID
 */
function removeFilter(filterID)
{
    SEARCHED_FILTER_LIST.remove(SEARCHED_FILTER_LIST.findWhere({id: filterID}));
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
        "iDisplayLength": 25,
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

    loadSampleGroups(workspaceKey, SAMPLE_GROUP_LIST);

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

            addFilterDialog.initialize(workspaceKey, allSamples);

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
    name = name.replace(new RegExp('\.vcf'), '');
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
            loadWorkspaces(WORKSPACE_LIST);
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