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
    var indexNames;

    // array of indexes that should be updated automatically
    var notReadyIndexes = new Array();
    var TIMER_INTERVAL = 5000; // 5 seconds
    setInterval(updateNotReadyIndexes, TIMER_INTERVAL);

    function loadIndexNames()
    {
        // synchronous AJAX call to server for index information
        $.ajax({
            async: false,
            url: "/mongo_svr/ve/index/getIndexes/" + workspaceKey,
            dataType: "json",
            success: function(json) {

                indexNames = new Array();
                var fields = json.fields;
                for (var i = 0; i < fields.length; i++) {
                    var fieldName = getSortedAttrNames(fields[i].key)[0];
                    indexNames.push(fieldName);
                }
            },
            error: jqueryAJAXErrorHandler
        });
    }

    function createIndex(index)
    {
        var indexName = getServerSideIndexName(index);
        console.log("Adding auto-updates for index "  + indexName);
        notReadyIndexes.push(index);

        $.ajax({
            url: "/mongo_svr/ve/index/createFieldIndex/" + workspaceKey+"/f/" + indexName,
            dataType: "json",
            success: function(json) {
                console.log("created index " + indexName + " with return status: " + json.status);
            },
            error: jqueryAJAXErrorHandler
        });
    }

    function deleteIndex(index)
    {
        var indexName = getServerSideIndexName(index);
        console.log("Adding auto-updates for index "  + indexName);
        notReadyIndexes.push(index);

        $.ajax({
            url: "/mongo_svr/ve/index/dropFieldIndex/" + workspaceKey+"/f/" + indexName + "_1",
            dataType: "json",
            success: function(json) {
                console.log("dropped index " + indexName + " with return status: " + json.status);
            },
            error: jqueryAJAXErrorHandler
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
        notReadyIndexes = new Array();

        // create Index models
        _.each(dataFields.models, function(vcfDataField) {

            var fieldIndexNames = new Array(); // a single data field may have 0 or more indexes
            var indexList;
            switch (vcfDataField.get("category"))
            {
                case VCFDataCategory.GENERAL:
                    fieldIndexNames.push(vcfDataField.get("name"));
                    indexList = generalIndexes;
                    break;
                case VCFDataCategory.INFO:
                    fieldIndexNames.push(vcfDataField.get("name"));
                    indexList = infoIndexes;
                    break;
                case VCFDataCategory.FORMAT:
                    // 2 indexes per FORMAT field (min,max)
                    fieldIndexNames.push("min."+vcfDataField.get("name"));
                    fieldIndexNames.push("max."+vcfDataField.get("name"));
                    indexList = formatIndexes;
                    break;
            };

            var status;
            var progress = 0; // TODO
            for (var i=0; i < fieldIndexNames.length; i++ )
            {
                var name = fieldIndexNames[i];
                var index = new DatabaseIndex({name: name, dataField: vcfDataField, status: status, progress:progress});
                if (isIndexed(index)) {

                    // TODO: check for building indexes for auto-updates

                    index.set("status", IndexStatus.READY);
                    overallStatus.set("numReady", overallStatus.get("numReady") + 1);
                } else {
                    index.set("status", IndexStatus.NONE);
                }
                indexList.add(index);
            }
        });
    }

    function getServerSideIndexName(index)
    {
        var indexNameBase = index.get("name");
        var vcfDataField = index.get("dataField");

        switch (vcfDataField.get("category"))
        {
            case VCFDataCategory.GENERAL:
                return indexNameBase;
            case VCFDataCategory.INFO:
                return "INFO." + indexNameBase;
            case VCFDataCategory.FORMAT:
                return "FORMAT." + indexNameBase;
        };
    }

    /**
     * Checks the given DatabaseIndex model against the server information about what
     * is indexed.
     *
     * @param index
     * @returns {boolean}
     */
    function isIndexed(index)
    {
        if (jQuery.inArray( getServerSideIndexName(index), indexNames ) > -1) {
            return true;
        } else {
            return false;
        }
    }

    function isDataFieldIndexed(vcfDataField)
    {
        var index = getIndexByDataField(vcfDataField);
        return isIndexed(index);
    }

    /**
     *
     */
    function updateNotReadyIndexes()
    {
        if (notReadyIndexes.length == 0)
        {
            return;
        }

        // freshly load the indexed field names
        loadIndexNames();

        for (var i = 0; i < notReadyIndexes.length; i++) {

            var index = notReadyIndexes[i];
            var indexName = index.get("name");
            var status = index.get("status");
            var indexed = isIndexed(index);

            if ((status !== IndexStatus.READY) && indexed) {
                // data field was not indexed, but server is now indicating that it is
                index.set("status", IndexStatus.READY);
                overallStatus.set("numReady", overallStatus.get("numReady") + 1);

                // delete key
                var keyIdx = notReadyIndexes.indexOf(indexName);
                if (keyIdx > -1) {
                    notReadyIndexes.splice(keyIdx, 1);
                }
                console.log("Removing auto-updates for index "  + indexName );

            } else if ((status !== IndexStatus.NONE) && !indexed) {
                // update Index model
                index.set("status", IndexStatus.NONE);
                overallStatus.set("numReady", overallStatus.get("numReady") - 1);

                // delete key
                var keyIdx = notReadyIndexes.indexOf(indexName);
                if (keyIdx > -1) {
                    notReadyIndexes.splice(keyIdx, 1);
                }
                console.log("Removing auto-updates for index "  + indexName );
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

            loadIndexNames();
        },

        /**
         * Refresh all workspaces from server.
         */
        refreshIndexes: refreshAllIndexes,

        isDataFieldIndexed: isDataFieldIndexed,

        getGeneralIndexes: function()
        {
            return generalIndexes;
        },

        getInfoIndexes: function()
        {
            return infoIndexes;
        },

        getFormatIndexes: function()
        {
            return formatIndexes;
        },

        getOverallIndexStatus: function()
        {
            return overallStatus;
        },

        createIndex: createIndex,

        deleteIndex: deleteIndex,

        getIndexByDataField: getIndexByDataField
    };

};