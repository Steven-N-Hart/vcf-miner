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

var FILTER_NONE            = new Filter({name: 'none',          operator: FilterOperator.UNKNOWN, displayOperator: '',  value: '' , displayValue: '', id:'id-none'});

// GLOBAL CONSTANT
var MAX_RESULTS = 1000;

var SEARCHED_FILTER_LIST = new FilterList;

var INFO_FILTER_LIST = new FilterList;

var searchedView;

var SAMPLE_GROUP_LIST = new SampleGroupList();

var addFilterDialog;
var variantTable;
var columnsDialog;
var WorkspaceController;

$( document ).ready(function()
{
    //test for MSIE x.x;
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent))
    {
        $('#getting_started_content').append($('#browser_not_supported_pane'));
        $('#browser_not_supported_pane').toggle();

        // end execution here
        return;
    }
    else
    {
        $('#getting_started_content').append($('#welcome_pane'));
        $('#welcome_pane').toggle();
    }

    searchedView = new SearchedView(SEARCHED_FILTER_LIST);

    addFilterDialog = new AddFilterDialog(INFO_FILTER_LIST, SEARCHED_FILTER_LIST, SAMPLE_GROUP_LIST);
    $('#show_add_filter_dialog_button').click(function (e)
    {
        addFilterDialog.show();
    });

    variantTable = new VariantTable(SEARCHED_FILTER_LIST);

    columnsDialog = new ColumnsDialog(variantTable);
    // delegated event listener since the toolbar is added dynamically to a DataTable
    $(document).on('click', '#columns_button', function()
    {
        columnsDialog.show();
    });

    initTemplates();

    workspaceController = new WorkspaceController(setWorkspace);
    workspaceController.refreshWorkspaces();
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

    var genes               = new Array();
    var sampleGroups        = new Array();
    var infoFlagFilters     = new Array();
    var infoNumberFilters   = new Array();
    var infoStringFilters   = new Array();

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
            case FilterCategory.SAMPLE_MIN_ALT_READS:
                query.minAltReads = filter.get("value");
                break;
            case FilterCategory.SAMPLE_MIN_NUM_SAMPLES:
                query.minNumSample = filter.get("value");
                break;
            case FilterCategory.SAMPLE_MAX_NUM_SAMPLES:
                query.maxNumSample = filter.get("value");
                break;
            case FilterCategory.SAMPLE_MIN_AC:
                query.minAC = filter.get("value");
                break;
            case FilterCategory.SAMPLE_MAX_AC:
                query.maxAC = filter.get("value");
                break;
            case FilterCategory.SAMPLE_MIN_PHRED:
                query.minPHRED = filter.get("value");
                break;
            case FilterCategory.GENE:
                genes = genes.concat(filter.get("value"));
                break;
        }
    });

    query.genes             = genes;
    query.sampleGroups      = sampleGroups;
    query.infoFlagFilters   = infoFlagFilters;
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
            variantTable.addRows(json.results, displayCols);

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
 * Callback
 *
 * @param workspace
 */
function setWorkspace(workspace)
{
    var workspaceKey = workspace.get("key");
    console.debug("User selected workspace: " + workspaceKey);

    searchedView.setWorkspace(workspaceKey);

    // reset collections
    INFO_FILTER_LIST.reset();
    SEARCHED_FILTER_LIST.reset();

    // update screens
    $("#getting_started").toggle(false);
    $("#jquery-ui-container").toggle(true);
    initWorkspaceScreen();

    $("#vcf_file").html("VCF File: " + workspace.get("alias"));

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

            var columns = new VariantTableColumnList();
            // standard 1st 7 VCF file columns
            columns.add(new VariantTableColumn({visible:true,  name:'CHROM',  displayName:'CHROM',  description:'The chromosome.'}));
            columns.add(new VariantTableColumn({visible:true,  name:'POS',    displayName:'POS',    description:'The reference position, with the 1st base having position 1.'}));
            columns.add(new VariantTableColumn({visible:true,  name:'ID',     displayName:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
            columns.add(new VariantTableColumn({visible:true,  name:'REF',    displayName:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
            columns.add(new VariantTableColumn({visible:true,  name:'ALT',    displayName:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
            columns.add(new VariantTableColumn({visible:false, name:'QUAL',   displayName:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
            columns.add(new VariantTableColumn({visible:false, name:'FILTER', displayName:'FILTER', description:'PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));

            columns.add(new VariantTableColumn({visible:true,  name:'GenotypePostitiveCount', displayName:'#_Samples', description:'The number of samples.'}));
            columns.add(new VariantTableColumn({visible:true,  name:'GenotypePositiveList',  displayName:'Samples',   description:'The names of samples.'}));


            for (var i = 0; i < infoFieldNames.length; i++) {
                var infoFieldName = infoFieldNames[i];
                if (info.hasOwnProperty(infoFieldName))
                {
                    columns.add(new VariantTableColumn({visible:false,  name:'INFO.'+infoFieldName,  displayName:infoFieldName,   description:info[infoFieldName].Description}));

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

            // rebuild the DataTables widget since columns have changed
            variantTable.initialize(workspaceKey, columns);

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

            searchedView.setDisplayCols(variantTable.getVisibleColumns());

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