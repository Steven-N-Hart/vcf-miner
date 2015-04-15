/**
 * Created with IntelliJ IDEA.
 * User: duffp
 * Date: 9/13/13
 * Time: 12:02 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Produces a hash code for the given string.
 * @param s
 * @returns {Object}
 */
function hash(s)
{
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

/**
 * Gets attribute names for the given object sorted alphabetically
 * in an array.
 * @param object
 * @returns Array of strings sorted alphabetically.
 */
function getSortedAttrNames(object)
{
    var attrNames = new Array();
    for (var key in object)
    {
        attrNames.push(key);
    }

    // sort by key name alphabetically
    attrNames.sort(function(a,b) { return a.localeCompare(b) } );

    return attrNames;
}

function SortByName(a, b)
{
    var aName = a.toLowerCase();
    var bName = b.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function S4()
{
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
/**
 * Generates a GUID.
 * @returns {string}
 */
function guid()
{
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/**
 * Deletes properties from an object based on the specified function shouldDeleteFunc()
 * @param object
 * @param shouldDeleteFunc
 *          Function that takes 2 parameters: 1. the object itself, 2. the property name
 */
function deleteObjectProperties(object, shouldDeleteFunc)
{
    for (var key in object)
    {
        if (shouldDeleteFunc(object, key))
        {
            delete object[key];
        }
    }
}

/**
 * Selects the first radio input in a group.
 * @param groupName
 *          The name of the radio group (e.g. name attribute)
 */
function selectFirstRadioInput(groupName)
{
    var firstRadioInput = $("input[type=radio][name="+groupName+"]:first");
    firstRadioInput.prop('checked',true);

}

/**
 * Translate given timestamp object into a human readable string.
 *
 * @param timestamp
 * @returns {string}
 */
function getDateString(timestamp)
{
    var dateStr = '';
    if (typeof timestamp !== "undefined")
    {
        dateStr = moment(timestamp).format('MM/DD/YYYY h:mm A'); ;
    }
    return dateStr;
}

/**
 * Builds a query object.
 *
 * @param filterStepList Backbone collection of filter models.
 * @param workspaceKey
 * @returns {Object} Query object
 */
function buildQuery(filterStepList, workspaceKey) {
    // build query from FILTER model
    var query = new Object();
    query.numberResults = MongoApp.settings.maxFilteredVariants;

    query.workspace = workspaceKey;

    var sampleGroups        = new Array();
    var infoFlagFilters     = new Array();
    var infoNumberFilters   = new Array();
    var infoStringFilters   = new Array();
    var sampleNumberFilters = new Array();
    var customNumberFilters = new Array();

    // loop through filter collection
    _.each(filterStepList.models, function(filterStep) {

        _.each(filterStep.get("filters").models, function(filter) {
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
                    var inSample;
                    if (filter.get("category") == FilterCategory.IN_GROUP)
                        inSample = true;
                    if (filter.get("category") == FilterCategory.NOT_IN_GROUP)
                        inSample = false;
                    sampleGroups.push(filter.toSampleGroupPOJO(workspaceKey, inSample));
                    break;
                case FilterCategory.FORMAT:
                    sampleNumberFilters.push(filter.toSampleNumberFilterPojo());
                    break;
            }

            if (filter instanceof AltAlleleDepthFilter) {
                customNumberFilters.push(filter.toSampleNumberFilterPojo());
            }
        });
    });

    query.sampleGroups        = sampleGroups;
    query.infoFlagFilters     = infoFlagFilters;
    query.infoNumberFilters   = infoNumberFilters;
    query.infoStringFilters   = infoStringFilters;
    query.sampleNumberFilters = sampleNumberFilters;
    query.customNumberFilters = customNumberFilters;

    return query;
}

/**
 * Handler for failed AJAX calls.  This handler is responsible for translating the error
 * into the proper marionette events.
 *
 * @param xmlHttpRequest
 *  The {@link XMLHttpRequest} AJAX call that failed.
 *
 */
function genericAJAXErrorHandler(xmlHttpRequest) {

    if (xmlHttpRequest.status == 401) {

        // HTTP response status 401 "Unauthorized" indicates an expired user token
        MongoApp.dispatcher.trigger(MongoApp.events.SESSION_EXPIRED);

    } else {

        var originalErrorText = xmlHttpRequest.responseText;

        // defaults to original error text
        var errorText = originalErrorText;

        // If we're dealing with an HTML page, pull out content inside <body> ... </body> tags
        var beginBodyTag = originalErrorText.indexOf('<body>');
        var endBodyTag   = originalErrorText.indexOf('</body>');
        if ((beginBodyTag != -1) && (endBodyTag != -1)) {
            errorText = originalErrorText.substring(beginBodyTag + '<body>'.length, endBodyTag);

            // replace <h1> tags with bootstrap <strong>
            errorText = errorText.replace('<h1>', '<strong>');
            errorText = errorText.replace('<H1>', '<strong>');
            errorText = errorText.replace('</h1>', '</strong>');
            errorText = errorText.replace('</H1>', '</strong>');
        }

        MongoApp.dispatcher.trigger(MongoApp.events.SERVER_ERROR, errorText);
    }
}

/**
 * Handler for failed AJAX calls.
 *
 * @param jqXHR
 *      jQuery XMLHttpRequest object that is a superset of the browser's native XMLHTTPRequest object.
 * @param textStatus
 *      A string describing the type of error that occurred
 * @param errorThrown
 *      An optional exception object.  Possible values for the second argument (besides null) are "timeout", "error",
 *      "abort", and "parsererror". When an HTTP error occurs, errorThrown receives the textual portion of the HTTP
 *      status, such as "Not Found" or "Internal Server Error."
 *
 * @constructor
 */
function jqueryAJAXErrorHandler(jqXHR, textStatus, errorThrown) {

    console.debug("AJAX error: status=" + jqXHR.status + " textStatus=" + textStatus + " errorThrown=" + errorThrown);

    genericAJAXErrorHandler(jqXHR);
}