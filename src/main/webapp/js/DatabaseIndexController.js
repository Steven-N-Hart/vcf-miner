/**
 *
 * @returns {{refreshWorkspaces: Function, getWorkspace: Function}}
 * @constructor
 */
var DatabaseIndexController = function () {

    // private vars
    var workspaceKey;
    var overallStatus = new IndexesStatus();
    var dataFields;
    var generalIndexes = new DatabaseIndexList();
    var infoIndexes = new DatabaseIndexList();
    var formatIndexes = new DatabaseIndexList();

    // array of dataFields that should be updated automatically
    var notReadyDataFields = new Array();
    var TIMER_INTERVAL = 5000; // 5 seconds
    setInterval(updateNotReadyIndexes, TIMER_INTERVAL);

    new IndexesStatusView(
        {
            "el": $('#indexes_status_div'),
            "model": overallStatus
        }
    );

    new IndexTableView(
        {
            "el": $('#general_indexes_table_div'),
            "model": generalIndexes,
            "sortable":false,
            "createIndexCallback": createIndex,
            "dropIndexCallback": deleteIndex
        }
    );
    new IndexTableView(
        {
            "el": $('#info_indexes_table_div'),
            "model": infoIndexes,
            "sortable":true,
            "createIndexCallback": createIndex,
            "dropIndexCallback": deleteIndex
        }
    );
    new IndexTableView(
        {
            "el": $('#format_indexes_table_div'),
            "model": formatIndexes,
            "createIndexCallback": createIndex,
            "dropIndexCallback": deleteIndex
        }
    );

    function getIndexedFieldNames()
    {
        var indexedFieldNames = new Array();

        // synchronous AJAX call to server for index information
        $.ajax({
            async: false,
            url: "/mongo_svr/ve/index/getIndexes/" + workspaceKey,
            dataType: "json",
            success: function(json) {

                var fields = json.fields;
                for (var i = 0; i < fields.length; i++) {
                    var fieldName = getSortedAttrNames(fields[i].key)[0];
                    indexedFieldNames.push(fieldName);
                }
            },
            error: function(jqXHR, textStatus) {

                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });

        return indexedFieldNames;
    }

    function getOperations()
    {
        var indexedFieldNames = new Array();

        // synchronous AJAX call to server for index information
        $.ajax({
            async: false,
            url: "/mongo_svr/ve/index/getOperations/" + workspaceKey,
            dataType: "json",
            success: function(json) {

            },
            error: function(jqXHR, textStatus) {

                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });

        return indexedFieldNames;
    }

    function createIndex(vcfDataField)
    {
        var fieldId = vcfDataField.get("id");
        var indexName = getIndexName(vcfDataField);
        console.log("Adding auto-updates for VCF field "  + fieldId);
        notReadyDataFields.push(vcfDataField);

        $.ajax({
            url: "/mongo_svr/ve/index/createFieldIndex/" + workspaceKey+"/f/" + indexName,
            dataType: "json",
            success: function(json) {
                console.log("created index for " + fieldId + " with return status: " + json.status);
            },
            error: function(jqXHR, textStatus) {

                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    function deleteIndex(vcfDataField)
    {
        var fieldId = vcfDataField.get("id");
        var indexName = getIndexName(vcfDataField);
        console.log("Adding auto-updates for VCF field "  + fieldId);
        notReadyDataFields.push(vcfDataField);

        $.ajax({
            url: "/mongo_svr/ve/index/dropFieldIndex/" + workspaceKey+"/f/" + indexName + "_1",
            dataType: "json",
            success: function(json) {
                console.log("dropped index for " + fieldId + " with return status: " + json.status);
            },
            error: function(jqXHR, textStatus) {

                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    /**
     * Refreshes the Backbone collection of indexes by querying the server.
     */
    function refreshAllIndexes()
    {
        console.log("refreshing all indexes");

        // clear out indexes
        generalIndexes.reset();
        infoIndexes.reset();
        formatIndexes.reset();
        overallStatus.set("numReady", 0);

        var indexedFieldNames = getIndexedFieldNames();

        // create Index models
        _.each(dataFields.models, function(vcfDataField) {

            var status;
            var progress = 0; // TODO
            if (isDataFieldIndexed(vcfDataField, indexedFieldNames)) {

                // TODO: check for building indexes for auto-updates


                status = IndexStatus.READY;
                overallStatus.set("numReady", overallStatus.get("numReady") + 1);
            } else {
                status = IndexStatus.NONE;
            }

            var index = new DatabaseIndex({dataField: vcfDataField, status: status, progress:progress});
            switch (vcfDataField.get("category"))
            {
                case VCFDataCategory.GENERAL:
                    generalIndexes.add(index);
                    break;
                case VCFDataCategory.INFO:
                    infoIndexes.add(index);
                    break;
                case VCFDataCategory.FORMAT:
                    formatIndexes.add(index);
                    break;
            };
        });
    }

    function getIndexName(vcfDataField)
    {
        var fieldId = vcfDataField.get("id");

        switch (vcfDataField.get("category"))
        {
            case VCFDataCategory.GENERAL:
                return fieldId;
            case VCFDataCategory.INFO:
                return "INFO." + fieldId;
            case VCFDataCategory.FORMAT:
                return "FORMAT." + fieldId;
        };
    }

    function isDataFieldIndexed(vcfDataField, indexedFieldNames)
    {
        if (jQuery.inArray( getIndexName(vcfDataField), indexedFieldNames ) > -1) {
            return true;
        } else {
            return false;
        }
    }

    /**
     *
     */
    function updateNotReadyIndexes()
    {
        if (notReadyDataFields.length == 0)
        {
            return;
        }

        var indexedFieldNames = getIndexedFieldNames();

        for (var i = 0; i < notReadyDataFields.length; i++) {

            var vcfDataField = notReadyDataFields[i];
            var index = getIndexByDataField(vcfDataField);
            var status = index.get("status");
            var isIndexed = isDataFieldIndexed(vcfDataField, indexedFieldNames);

            if ((status !== IndexStatus.READY) && isIndexed) {
                // data field was not indexed, but server is now indicating that it is
                index.set("status", IndexStatus.READY);
                overallStatus.set("numReady", overallStatus.get("numReady") + 1);

                // delete key
                var keyIdx = notReadyDataFields.indexOf(vcfDataField);
                if (keyIdx > -1) {
                    notReadyDataFields.splice(keyIdx, 1);
                }
                console.log("Removing auto-updates for data field "  + vcfDataField.get("id") );

            } else if ((status !== IndexStatus.NONE) && !isIndexed) {
                // update Index model
                var index = getIndexByDataField(vcfDataField);
                index.set("status", IndexStatus.NONE);
                overallStatus.set("numReady", overallStatus.get("numReady") - 1);

                // delete key
                var keyIdx = notReadyDataFields.indexOf(vcfDataField);
                if (keyIdx > -1) {
                    notReadyDataFields.splice(keyIdx, 1);
                }
                console.log("Removing auto-updates for data field "  + vcfDataField.get("id") );
            }
        }
    }

    function getIndexList(category)
    {
        switch (category)
        {
            case VCFDataCategory.GENERAL:
                return generalIndexes;
            case VCFDataCategory.INFO:
                return infoIndexes;
            case VCFDataCategory.FORMAT:
                return formatIndexes;
        };
    }

    function getIndexByDataField(vcfDataField)
    {
        var indexes = getIndexList(vcfDataField.get("category"));

        var match;
        _.each(indexes.models, function(index) {
            if (vcfDataField == index.get("dataField"))
            {
                match = index;
                return;
            }
        });

        return match;
    }

    // public API
    return {

        initialize: function(wsKey, vcfDataFields)
        {
            workspaceKey = wsKey;
            dataFields = vcfDataFields;
        },

        /**
         * Refresh all workspaces from server.
         */
        refreshIndexes: refreshAllIndexes
    };

};