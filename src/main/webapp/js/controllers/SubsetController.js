/**
 * Controller for {@link SampleFilter} related objects.
 * @type {*}
 */
var SubsetController = Backbone.Marionette.Controller.extend({

    workspaceKey: null,
    userToken: null,

    /**
     * Collection of {@link SampleMetadataField} models.
     * NOTE: NULL initially because this is passed in through the constructor options
     */
    metadataFieldList: null,

    /** SampleFilterList to store all SampleFilters that a user has added so far (one row = 1 SampleFilter) */
    sampleFilterList: null,

    /**
     * Collection of ALL {@link Sample} models.
     *
     * NOTE: NULL initially because this is passed in through the constructor options
     */
    samplesAllList: null,

    /**
     * A subset of {@link SubsetController#samplesAllList} after {@link SubsetController#filters} has been applied.
     *
     * NOTE: NULL initially because this is passed in through the constructor options
     */
    sampleSubsetList: null,

    sampleFilterLayout: null,

    initialize: function (options) {

        // Initialize the sampleFilterList to empty list
        // NOTE: These two variables MUST be initiated to be passed to the SampleFilterLayout constructor in the function showSampleFilters()
        this.sampleFilterList  = options.sampleFilterList;
        this.metadataFieldList = options.metadataFieldList;
        this.samplesAllList    = options.sampleList;
        this.sampleSubsetList  = options.sampleSubsetList;

        // Set the workspaceKey and userToken
        this.workspaceKey = options.workspaceKey;
        this.userToken = options.userToken;

        var self = this;

        // Create the SampleSelectionLayout that will be passed to the SubsteFilterTabLayout
        this.sampleSelectionLayout = new SampleSelectionLayout({
            samples: this.sampleSubsetList
        });

        this.subsetTabLayout = new SubsetFilterTabLayout({
            metadataFields: this.metadataFieldList,
            filters: this.sampleFilterList,
            sampleSubsetList: this.sampleSubsetList,
            countFunction: this.getStringValuesCount,
            valuesFunction: this.getStringValues,
            typeAheadFunction: this.getTypeAheadValues,
            sampleSelectionLayout: this.sampleSelectionLayout
        });


        // Wire events to functions
        MongoApp.vent.on("addFilter", function () {
            self.addFilter();
        });

        MongoApp.vent.on("removeFilter", function (sampleFilter) {
            self.removeFilter(sampleFilter);
        });
        MongoApp.vent.on("applyFilters", function () {
            self.applyFilters();
        });
    },

    showSubsetTab: function (options) {
        options.region.show(this.subsetTabLayout);
    },

    /**
     * Add a SampleFilter object to the SampleFilterList.
     * This is called when the "+" button is clicked to add a new SampleFilter row
     */
    addFilter: function () {

//        var metadataFieldListSize = _.size(this.metadataFieldList);
//
//        // If not already loaded, then fetch list of metadata fields  (these are the fields in the first combobox)
//        if( metadataFieldListSize == 0 ) {
//            this.fetchMetadataFieldList(this.workspaceKey, this.userToken, this.metadataFieldList);
//        }
//
        // TODO:  What do we do with newSampleFilter passed into the function?  Is this just supposed to be "options" and not really have anything in it?

        var newFilter = new SampleFilter();
        this.sampleFilterList.add(newFilter);

        this.recalculateLastFilter();
    },

    removeFilter: function (sampleFilter) {
        this.sampleFilterList.remove(sampleFilter);

        this.recalculateLastFilter();
    },


    //=========================================================================================================
    // Apply filters functions
    //=========================================================================================================

    /**
     * Applies the sample filters {@link SubsetController#sampleFilterList} to
     * all the samples {@link SubsetController#samplesAllList}.  The filtered results
     * are saved to the filtered samples collection {@link SubsetController#filteredSamples}.
     */
    applyFilters: function () {

        // TODO: implement - end result is the filtered samples are stored to this.sampleSubsetList

        // Remove all the samples from the sampleSubsetList
        while (this.sampleSubsetList.length > 0) {
            this.sampleSubsetList.pop();
        }

        // Loop through the full list of samples, then loop through the filters and if it passes the filter criteria, include it
        for (var i = 0; i < this.samplesAllList.length; i++) {
            var isPassesAllFilters = true;
            var sample = this.samplesAllList.models[i];
            for (var j = 0; j < this.sampleFilterList.models.length; j++) {
                var filter = this.sampleFilterList.models[j];
                // If the filter is not valid (the user hasn't selected the field), then skip it and check the next filter
                // Else, if the filter did not pass, then we will not add the sample
                if ( filter.attributes.values != null  &&  ! this.isPassesFilter(sample, filter) ) {
                    isPassesAllFilters = false;
                    break;
                }
            }
            // If the sample has passed all filters, then add it
            if (isPassesAllFilters) {
                this.sampleSubsetList.add(sample);
            }
        }

        // Now, trigger the table to refresh itself
        this.sampleSubsetList.once("sampleTableRefresh", this.sampleSelectionLayout.refreshTableData(), this.sampleSelectionLayout);
        this.sampleSubsetList.trigger("sampleTableRefresh", "refresh the table");
    },

    /** Does the sample pass the single filter?
     *  IN: Sample,  SampleFilter
     *  OUT: Boolean (true if the sample passes the filter, else false) */
    isPassesFilter: function (sample, filter) {
        // The filter can have multiple values if it is a string
        var filterValues = filter.attributes.values;
        var filterType = filter.attributes.metadataField.attributes.type;
        var fieldId = filter.attributes.metadataField.id;
        var filterOp = filter.attributes.operator;

        // For the sample, we need to find the Key-Value-Pair that matches filter id
        // sampleValues will be an array
        var sampleValues = this.getSampleValueFromKey(sample, fieldId);


        if (filterType == SampleMetadataFieldType.BOOLEAN) {
            var sampleVal = sampleValues[0];
            var isSame = sampleVal == filterValues;
            return isSame;
        } else if (filterType == SampleMetadataFieldType.FLOAT || filterType == SampleMetadataFieldType.INTEGER) {
            return this.isPassesNumericFilter(filterOp, sampleValues, filterValues);
        } else if (filterType == SampleMetadataFieldType.STRING) {
            return this.isPassesStringFilter(filterOp, sampleValues, filterValues);
        }
    },


    /** Does the numeric sample pass the filter?
     *  PRE: The filter should be checked to ensure it is a FLOAT or INTEGER field
     *  IN:  SampleFilterOperator, sampleValue (string), filterValue (numeric - single value)
     *  OUT: Boolean (true if the sample passes the filter, else false)    */
    isPassesNumericFilter: function (operator, sampleValues, filterValue) {
        // If the operator is NotEqual, then all samples values must be NotEqual (AND them together)
        if (operator == SampleFilterOperator.NEQ) {
            for(var i=0; i < sampleValues.length; i++) {
                if (sampleValues[i] == filterValue)
                    return false;
            }
            return true;
        }

        // Otherwise, for any other operator, only one of the sample values needs to match.
        for (var i = 0; i < sampleValues.length; i++) {
            var sampleVal = sampleValues[i];
            var isMatch =
                   (operator == SampleFilterOperator.EQ   && sampleVal == filterValue)
                || (operator == SampleFilterOperator.GT   && sampleVal >  filterValue)
                || (operator == SampleFilterOperator.GTEQ && sampleVal >= filterValue)
                || (operator == SampleFilterOperator.LT   && sampleVal <  filterValue)
                || (operator == SampleFilterOperator.LTEQ && sampleVal <= filterValue);
            if (isMatch) {
                return true;
            }
        }
        // All of the them failed to pass the filter, so return false
        return false;
    },


    /** Does the string sample pass the filter?
     *  PRE: The filter should be checked to ensure it is a STRING  field
     *  IN:  Sample, SampleFilter
     *  OUT: Boolean (true if the sample passes the filter, else false)    */
    isPassesStringFilter: function (operator, sampleValue, filterValues) {
        // The only options for string comparisons currently are '=' and '!='
        // HOWEVER, there can be multiple string values

        // If the operator is "=", then OR the values together,
        // But if the operator is "!=", then AND the values together
        var isPassedFilter = false;
        if (operator == SampleFilterOperator.EQ) {
            for (var filterVal in filterValues) {
                if (sampleValue == filterVal) {
                    isPassedFilter = true;
                }
            }
        } else if (operator == SampleFilterOperator.NEQ) {
            isPassedFilter = true;
            for (var filterVal in filterValues) {
                if (sampleValue == filterVal) {
                    isPassedFilter = false;
                }
            }
        }
        return isPassedFilter;
    },


    /** Given a sample, find the value within that sample for the given key (a string) */
    getSampleValueFromKey: function (sample, keyStr) {
        for (var key in sample.attributes.sampleMetadataFieldKeyValuePairs) {
            var k = key;
            if (key == keyStr) {
                var val = sample.attributes.sampleMetadataFieldKeyValuePairs[key]
                return val;
            }
        }
        return null;
    },

    //=========================================================================================================


    recalculateLastFilter: function () {

        // mark all existing sampleFilters as "not" last
        _.each(this.sampleFilterList.models, function (sampleFilter) {
            sampleFilter.set("isLast", false);
        });

        // mark last one
        if (this.sampleFilterList.models.length > 0) {
            this.sampleFilterList.models[this.sampleFilterList.models.length - 1].set("isLast", true)
        }
    },

    //=========================================================================================================

//    /**
//     * Get the list of metadata fields (along with their type) for a workspace
//     * INPUT:  A workspace key which matches one of the workspaces in mongo server
//     * RETURN: A SampleMetadataFieldList object
//     */
//    fetchMetadataFieldList: function(workspaceKey, userToken, sampleMetadataFieldList) {
//        // TEMP: REmove this when the REST call is in place -----------------------------------------
//        // HARDCODED STUB DATA (this data normally comes from the middle tier over REST)
//        sampleMetadataFieldList.add(new SampleMetadataField({id:"Field1 - Number", type:SampleMetadataFieldType.FLOAT,   desc: "Float field description..."}));
//        sampleMetadataFieldList.add(new SampleMetadataField({id:"Field2 - String", type:SampleMetadataFieldType.STRING,  desc: "String field description..."}));
//        sampleMetadataFieldList.add(new SampleMetadataField({id:"Field3 - Boolean", type:SampleMetadataFieldType.BOOLEAN, desc: "Boolean field description"}));
//
//        // TODO: Add the REST call to retrieve the data from mongo_svr here: ------------------------
//        // ......................
//        /*
//         $.ajax({
//            type: "POST",
//            url: "/mongosvr/workspaces/metadata",
//            data: {workspace: '$workspaceKey'},
//            dataType: "json",
//
//            // TODO: Can we just return the SampleMetadataFieldList directly?
//            // TODO: Will need objects of some kind so that we know the type and description as well
//            success: function(metadataFieldList) {
//                // TODO: Change all this
//                try {
//                    metaList = metadataFieldList;
//                    console.log("Returned list of metadata fields.  Now adding them to a SampleMetadataFieldList...");
//                } catch (exception) {
//                    console.log("Failed to retrieve list of metadata fields");
//                    jqueryAJAXErrorHandler(exception.jqXHR, exception.textStatus, exception.errorThrown);
//                    MongoApp.dispatcher.trigger(MongoApp.events.METADATA_FIELDS_RETRIEVAL_FAILED);
//                }
//            },
//            error: jqueryAJAXErrorHandler
//         });
//         */
//
//        return sampleMetadataFieldList;
//    },


//    /**
//     * Get the list of data to populate the type-ahead combobox for String matching on each sample filter.
//     * (This is the list when you add a sample filter and select a field that is of type "String")
//     * MIKE-NOTE: Started with info from mongo_view.SecurityController.login() function
//     * INPUT:  A workspace key which matches one of the workspaces in mongo server
//     * RETURN: A string array containing sample names
//     */
//    fetchSampleNamesArray: function(workspaceKey, userToken, sampleNamesArray) {
//
//        sampleNamesArray.push("NA000001 - sample 1",
//                              "NA000002 - sample 2",
//                              "NA000003 - sample 3" );
//
//        /*
//        $.ajax({
//            type: "POST",
//            url: "/mongosvr/workspaces/samplenames",
//            data: {workspace: '$workspaceKey'},
//            dataType: "json",
//
//            success: function(sampleNamesArray) {
//                // TODO: Change all this
//                try {
//                    sampleNames = sampleNamesArray;
//                    console.log("Returned list of sample names");
//                } catch (exception) {
//                    console.log("Failed to retrieve list of sample names");
//                    jqueryAJAXErrorHandler(exception.jqXHR, exception.textStatus, exception.errorThrown);
//                    MongoApp.dispatcher.trigger(MongoApp.events.SAMPLE_NAMES_RETRIEVAL_FAILED);
//                }
//            },
//            error: jqueryAJAXErrorHandler
//        });
//        */
//
//        return sampleNamesArray;
//    },

    /**
     * For the given {@link SampleMetadataField} of type {@link SampleMetadataFieldType#string},
     * get a count of the TOTAL number of possible string values.
     *
     * @param metadataField The ##META to get possible values for.
     *
     * @returns An integer that represents the count.
     */
    getStringValuesCount: function (metadataField) {

        // TODO: hardcoded stubs - Make this a REST call back to the server
        if (metadataField.id == "Field 2 - String (<= cutoff)")
            return 5;
        else
            return 30;
    },

    /**
     * For the given {@link SampleMetadataField} of type {@link SampleMetadataFieldType#string},
     * get the possible string values.
     *
     * @param metadataField The ##META to get possible values for.
     *
     * @returns A {@link Array} of strings that represent the possible values.
     */
    getStringValues: function (metadataField) {

        var values = new Array();

        // TODO: hardcoded stubs - make this a REST call back to the server
        //       5 values for one id, 30 for all other string metadata
        values.push("A");
        values.push("B");
        values.push("C");
        values.push("D");
        values.push("E");
        if (metadataField.id != "Field 2 - String (<= cutoff)") {
            for (var i = 6; i <= 30; i++) {
                values.push("Value" + i);
            }
        }
        return values;

    },

    /**
     * For the given {@link SampleMetadataField} of type {@link SampleMetadataFieldType#string},
     * get the possible string values based on the given text string already typed by the user.
     *
     * @param metadataField The ##META to get possible values for.
     * @param text The text value typed by the user.
     *
     * @returns A {@link Array} of strings that represent the possible values.
     */
    getTypeAheadValues: function (metadataField, text) {

        var valuesFiltered = new Array();

        // TODO: hardcoded stubs - make this a REST call back to the server
        var valuesFull = getStringValues(metadataField);
        for (var i = 0; i < valuesFull.length; i++) {
            if (valuesFull[i].indexOf(text) != -1)
                valuesFiltered.push(valuesFull[i]);
        }
        return valuesFiltered;
    }

});