/**
 *
 * @returns {{refreshWorkspaces: Function, getWorkspace: Function}}
 * @constructor
 */
var DatabaseIndexController = function () {

    // private vars
    var workspaceKey;
    var dataFields;
    var indexes = new DatabaseIndexList();

    // array of index keys that should be updated automatically
    var notReadyKeys = new Array();
    var TIMER_INTERVAL = 5000; // 5 seconds
    setInterval(updateNotReadyIndexes, TIMER_INTERVAL);

    new IndexTableView(
        {
            "el": $('#indexes_table_div'),
            "model": indexes,
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
        console.log("Adding auto-updates for VCF field "  + fieldId);
        notReadyKeys.push(fieldId);

        $.ajax({
            url: "/mongo_svr/ve/index/createFieldIndex/" + workspaceKey+"/f/" + fieldId,
            dataType: "json",
            success: function(json) {
                console.log("creating index for " + fieldId + " with return status: " + json.status);
            },
            error: function(jqXHR, textStatus) {

                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    function deleteIndex(vcfDataField)
    {
        var fieldId = vcfDataField.get("id");
        console.log("Adding auto-updates for VCF field "  + fieldId);
        notReadyKeys.push(fieldId);

        $.ajax({
            url: "/mongo_svr/ve/index/dropFieldIndex/" + workspaceKey+"/f/" + fieldId + "_1",
            dataType: "json",
            success: function(json) {
                console.log("dropping index for " + fieldId + " with return status: " + json.status);
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
        indexes.reset();

        var indexedFieldNames = getIndexedFieldNames();

        // create Index models
        _.each(dataFields.models, function(vcfDataField) {

            var status;
            var progress = 0; // TODO
            if (jQuery.inArray( vcfDataField.get("id"), indexedFieldNames ) > -1) {

                // TODO: check for building indexes for auto-updates


                status = IndexStatus.READY;
            } else {
                status = IndexStatus.NONE;
            }

            indexes.add(new DatabaseIndex({dataField: vcfDataField, status: status, progress:progress}));
        });
    }

    /**
     *
     */
    function updateNotReadyIndexes()
    {
        if (notReadyKeys.length == 0)
        {
            return;
        }

        var indexedFieldNames = getIndexedFieldNames();

        for (var i = 0; i < notReadyKeys.length; i++) {
            if (jQuery.inArray( notReadyKeys[i], indexedFieldNames ) > -1) {
                // update Index model
                var index = getIndexByFieldId(notReadyKeys[i]);
                index.set("status", IndexStatus.READY);

                // delete key
                var keyIdx = notReadyKeys.indexOf(notReadyKeys[i]);
                if (keyIdx > -1) {
                    notReadyKeys.splice(keyIdx, 1);
                }
                console.log("Removing auto-updates for key "  + notReadyKeys[i]);
            } else {
                // update Index model
                var index = getIndexByFieldId(notReadyKeys[i]);
                index.set("status", IndexStatus.NONE);

                // delete key
                var keyIdx = notReadyKeys.indexOf(notReadyKeys[i]);
                if (keyIdx > -1) {
                    notReadyKeys.splice(keyIdx, 1);
                }
                console.log("Removing auto-updates for key "  + notReadyKeys[i]);
            }
        }
    }

    function getIndexByFieldId(fieldId)
    {
        var match;

        _.each(indexes.models, function(index) {
            if (fieldId == index.get("dataField").get("id"))
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