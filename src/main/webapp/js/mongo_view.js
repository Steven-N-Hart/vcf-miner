/**
 * Created with IntelliJ IDEA.
 * User: duffp
 * Date: 6/24/13
 * Time: 9:21 AM
 * To change this template use File | Settings | File Templates.
 */

// GLOBAL settings for entire system
var SETTINGS =
{
    maxFilteredVariants: 0,
    popupDuration: 0, // seconds
    maxFilterValues: 0,
    showMissingIndexWarning: false
};
var SETTINGS_TAB;

// GLOBAL: templates for showing messages to user in designated message area
var INFO_TEMPLATE;
var WARNING_TEMPLATE;
var WARNING_POPOVER_TEMPLATE;
var ERROR_TEMPLATE;

var FILTER_NONE            = new Filter({name: 'none', displayName: 'none', operator: FilterOperator.UNKNOWN, displayOperator: '',  value: '' , displayValue: '', id:'id-none'});

var SEARCHED_FILTER_LIST = new FilterList;

var VARIANT_TABLE_COLUMNS   = new VariantTableColumnList();
var VARIANT_TABLE_ROWS      = new VariantTableRowList();

var WORKSPACES = new WorkspaceList();

var searchedView;

var SAMPLE_GROUP_LIST = new SampleGroupList();

var addFilterDialog;
var WorkspaceController;
var variantTableView;
var indexController;

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

    indexController = new DatabaseIndexController();
    searchedView = new SearchedView(SEARCHED_FILTER_LIST);

    addFilterDialog = new AddFilterDialog(SEARCHED_FILTER_LIST, SAMPLE_GROUP_LIST, indexController);
    $('#show_add_filter_dialog_button').click(function (e)
    {
        addFilterDialog.show();
    });

    initTemplates();

    new VariantTableColumnView({"model": VARIANT_TABLE_COLUMNS});

    workspaceController = new WorkspaceController(setWorkspace);
    workspaceController.refreshWorkspaces();

    // clicking on brand is redirected to a click on home tab
    $('.navbar .brand').click(function(e)
        {
            $('#home_tab').click();
        }
    );

    // handle click event on navbar tabs
    $('#navbar_tabs a').click(function (e)
    {
        switch(e.target.id)
        {
            case 'home_tab':
                showHomeScreen();
                break;
            case 'settings_tab':
                showSettingsScreen();
                break;
            case 'table_tab':
                showTableScreen();
                break;
        }
        // switch active tab
        var parent = $(this).parent();
        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');

        $(this).tab('show');
    })

    SETTINGS_TAB = new SettingsTab(SETTINGS, indexController);
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
    query.numberResults = SETTINGS.maxFilteredVariants;

    query.workspace = workspaceKey;

    var sampleGroups        = new Array();
    var infoFlagFilters     = new Array();
    var infoNumberFilters   = new Array();
    var infoStringFilters   = new Array();
    var sampleNumberFilters = new Array();

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
            case FilterCategory.IN_GROUP:
            case FilterCategory.NOT_IN_GROUP:
                // lookup SampleGroup model that corresponds to name
                var group = SAMPLE_GROUP_LIST.findWhere({name: filter.get("value")});
                var inSample;
                if (filter.get("category") == FilterCategory.IN_GROUP)
                    inSample = true;
                if (filter.get("category") == FilterCategory.NOT_IN_GROUP)
                    inSample = false;
                sampleGroups.push(group.toSampleGroupPOJO(workspaceKey, inSample));
                break;
            case FilterCategory.FORMAT:
                sampleNumberFilters.push(filter.toSampleNumberFilterPojo());
                break;
        }
    });

    query.sampleGroups        = sampleGroups;
    query.infoFlagFilters     = infoFlagFilters;
    query.infoNumberFilters   = infoNumberFilters;
    query.infoStringFilters   = infoStringFilters;
    query.sampleNumberFilters = sampleNumberFilters;

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
    var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h3>Running Filters.  Please wait...</h3></div><div class="modal-body"></div></div>');
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

            // TODO:
            // populate the variant table
//            variantTable.addRows(json.results, displayCols);
            VARIANT_TABLE_ROWS.reset();

            var variants = json.results;
            for (var i = 0; i < variants.length; i++)
            {
                var variant = variants[i];

                // extract row values
                var rowValues = new Array();

                // loop through collection
                _.each(VARIANT_TABLE_COLUMNS.models, function(col)
                {
                    var name = col.get("name");

                    if (name.substring(0, 4) === 'INFO')
                    {
                        // INFO column
                        var infoFieldName = col.get("displayName");
                        var variantInfo = variant['INFO'];
                        if(variantInfo[infoFieldName] !== undefined)
                        {
                            rowValues.push(variantInfo[infoFieldName]);
                        }
                        else
                        {
                            rowValues.push("");
                        }
                    }
                    else
                    {
                        rowValues.push(variant[name]);
                    }
                });
                VARIANT_TABLE_ROWS.add(new VariantTableRow({"values": rowValues}));
            }
            VARIANT_TABLE_ROWS.trigger("finalize");

            // update count on Filter
            // loop through filter collection
            var lastFilter = _.last(SEARCHED_FILTER_LIST.models);
            lastFilter.set("numMatches", json.totalResults);

            if (json.totalResults > SETTINGS.maxFilteredVariants)
            {
                var m = 'Loaded only ' + SETTINGS.maxFilteredVariants;
                numMatchesLabel = $('#' + lastFilter.get("id") + "_num_matches_label");
                numMatchesLabel.popover('destroy');
                numMatchesLabel.popover(
                    {
                        html: true,
                        content: _.template(WARNING_POPOVER_TEMPLATE,{message: m})
                    }
                );
                numMatchesLabel.popover('show');
                setTimeout(
                    function(){numMatchesLabel.popover('hide');},
                    SETTINGS.popupDuration * 1000
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

function showHomeScreen()
{
    $("#getting_started").toggle(true);
    $("#jquery-ui-container").toggle(false);
    $("#settings").toggle(false);
}

function showTableScreen()
{
    $("#getting_started").toggle(false);
    $("#jquery-ui-container").toggle(true);
    $("#settings").toggle(false);
}

function showSettingsScreen()
{
    $("#getting_started").toggle(false);
    $("#jquery-ui-container").toggle(false);
    $("#settings").toggle(true);
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
    SEARCHED_FILTER_LIST.reset();
    VARIANT_TABLE_COLUMNS.reset();

    // destroy old view
    if (typeof variantTableView !== "undefined")
    {
        variantTableView.remove();
    }

    // create a new view for variant table
    variantTableView = new VariantTableDataView(
        {
            "model": VARIANT_TABLE_ROWS,
            "columns": VARIANT_TABLE_COLUMNS,
            "filters": SEARCHED_FILTER_LIST,
            "workspaceKey": workspaceKey
        }
    );
    $('#variant_table_div').append(variantTableView.el);

    // update screens
    $('#navbar_tab_table a').text(workspace.get("alias"));
    $('#navbar_tab_table').toggle(true); // set visible if not already
    $('#table_tab').click(); // register click event to switch to that tab

    initWorkspaceScreen();

    $("#vcf_file").html("VCF File: " + workspace.get("alias"));

    loadSampleGroups(workspaceKey, SAMPLE_GROUP_LIST);

    var metadataRequest = $.ajax({
        url: "/mongo_svr/ve/meta/workspace/" + workspaceKey,
        dataType: "json",
        success: function(json)
        {
            var info = json.INFO;

            // get the INFO field names sorted alphabetically
            var infoFieldNames = getSortedAttrNames(info);

            // standard 1st 7 VCF file columns
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'CHROM',  displayName:'CHROM',  description:'The chromosome.'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'POS',    displayName:'POS',    description:'The reference position, with the 1st base having position 1.'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'ID',     displayName:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'REF',    displayName:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'ALT',    displayName:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:false, name:'QUAL',   displayName:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:false, name:'FILTER', displayName:'FILTER', description:'PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));

            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'GenotypePostitiveCount', displayName:'#_Samples', description:'The number of samples.'}));
            VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:true,  name:'GenotypePositiveList',  displayName:'Samples',   description:'The names of samples.'}));


            // TODO: switch VariantTableColumn to use these VCFDataField models
            var dataFields = new VCFDataFieldList();
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'CHROM',  description:'The chromosome.'}));
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'POS',    description:'The reference position, with the 1st base having position 1.'}));
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
            dataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, id:'FILTER', description:'PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));

            for (var i = 0; i < infoFieldNames.length; i++) {
                var infoFieldName = infoFieldNames[i];
                if (info.hasOwnProperty(infoFieldName))
                {
                    VARIANT_TABLE_COLUMNS.add(new VariantTableColumn({visible:false,  name:'INFO.'+infoFieldName,  displayName:infoFieldName,   description:info[infoFieldName].Description}));

                    var dataType;
                    switch(info[infoFieldName].type)
                    {
                        case 'Flag':
                            dataType = VCFDataType.FLAG;
                            break;
                        case 'Integer':
                            dataType = VCFDataType.INTEGER;
                            break;
                        case 'Float':
                            dataType = VCFDataType.FLOAT;
                            break;
                        default:
                            dataType = VCFDataType.STRING;
                            break;
                    }

                    var category;
                    switch(info[infoFieldName].EntryType)
                    {
                        case 'FORMAT':
                            category = VCFDataCategory.FORMAT;
                            break;
                        case 'INFO':
                            category = VCFDataCategory.INFO;
                            break;
                    }
                    dataFields.add(new VCFDataField({category:category, type:dataType, id:infoFieldName, description:info[infoFieldName].Description}));
                }
            }

            variantTableView.render();

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

            // TODO:
//            searchedView.setDisplayCols(variantTable.getVisibleColumns());

            addFilterDialog.initialize(workspaceKey, allSamples, dataFields);
            SETTINGS_TAB.initialize(workspaceKey);
            indexController.initialize(workspaceKey, dataFields);
            indexController.refreshIndexes();

            // backbone MVC will send query request based on adding this filter
            SEARCHED_FILTER_LIST.add(FILTER_NONE);
        },
        error: function(jqXHR, textStatus)
        {
            $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
        }
    });
}