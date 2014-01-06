/**
 *
 * @returns {{refreshWorkspaces: Function, getWorkspace: Function}}
 * @constructor
 */
var DatabaseIndexController = function () {

    // private vars
    var indexes = new DatabaseIndexList();

    // array of index keys that should be updated automatically
    var notReadyKeys = new Array();
    var TIMER_INTERVAL = 10000; // 10 seconds
    setInterval(updateNotReadyIndexes, TIMER_INTERVAL);

    new IndexTableView(
        {
            "el": $('#indexes_table_div'),
            "model": indexes
        }
    );

    /**
     *
     */
    function updateNotReadyIndexes()
    {
        // TODO:

//        if (notReadyKeys.length == 0)
//        {
//            return;
//        }
//
//        // perform REST call per-user
//        for (var i = 0; i < users.length; i++)
//        {
//            var user = users[i];
//            // get workspace information from server
//            var workspaceRequest = $.ajax({
//                url: "/mongo_svr/ve/q/owner/list_workspaces/" + user,
//                dataType: "json",
//                success: function(json)
//                {
//
//                    // each workspace object has an increment num as the attr name
//                    for (var attr in json) {
//                        if (json.hasOwnProperty(attr)) {
//                            var key = json[attr].key;
//                            var ws = workspaces.findWhere({key: key});
//
//                            if($.inArray(key, notReadyKeys) != -1)
//                            {
//                                console.log("updating status for key " + key);
//                                ws.set("status", json[attr].ready);
//                                ws.set("date", getDateString(json[attr].timestamp));
//
//                                if ((ws.get("status") == ReadyStatus.READY) ||
//                                    (ws.get("status") == ReadyStatus.FAILED))
//                                {
//                                    // delete key
//                                    var index = notReadyKeys.indexOf(key);
//                                    if (index > -1) {
//                                        notReadyKeys.splice(index, 1);
//                                    }
//                                    console.log("Removing auto-updates for key "  + key);
//                                }
//                            }
//
//                        }
//                    }
//                },
//                error: function(jqXHR, textStatus)
//                {
//                    $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
//                }
//            });
//        }
    }

    /**
     * Refreshes the Backbone collection of workspaces by querying the server.
     */
    function refreshAllIndexes()
    {
        console.log("refreshing all indexes");

        // clear out workspaces
        indexes.reset();

        // stubbed out
        var fieldChrom = new VCFDataField({category: VCFDataCategory.GENERAL, id:'CHROM',  description:'The chromosome.'});
        var fieldPos   = new VCFDataField({category: VCFDataCategory.GENERAL, id:'POS',    description:'The reference position, with the 1st base having position 1.'});
        var fieldId    = new VCFDataField({category: VCFDataCategory.GENERAL, id:'ID',     description:'Semi-colon separated list of unique identifiers.'});
        var fieldRef   = new VCFDataField({category: VCFDataCategory.GENERAL, id:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'});
        var fieldAlt   = new VCFDataField({category: VCFDataCategory.GENERAL, id:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'});
        var fieldQual  = new VCFDataField({category: VCFDataCategory.GENERAL, id:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'});
        var fieldFilter= new VCFDataField({category: VCFDataCategory.GENERAL, id:'FILTER', description:'PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'});
        var indexChrom = new DatabaseIndex({dataField: fieldChrom, status: IndexStatus.NONE, progress:0});
        var indexPos   = new DatabaseIndex({dataField: fieldPos,   status: IndexStatus.BUILDING, progress:33});
        var indexId    = new DatabaseIndex({dataField: fieldId,    status: IndexStatus.READY, progress:100});
        var indexRef   = new DatabaseIndex({dataField: fieldRef,   status: IndexStatus.DROPPING, progress:0});
        var indexAlt   = new DatabaseIndex({dataField: fieldAlt,   status: IndexStatus.BUILDING, progress:85});

        indexes.add(indexChrom);
        indexes.add(indexPos);
        indexes.add(indexId);
        indexes.add(indexRef);
        indexes.add(indexAlt);


        // TODO:
//        // perform REST call per-user
//        for (var i = 0; i < users.length; i++)
//        {
//            var user = users[i];
//            // get workspace information from server
//            var workspaceRequest = $.ajax({
//                url: "/mongo_svr/ve/q/owner/list_workspaces/" + user,
//                dataType: "json",
//                success: function(json)
//                {
//
//                    // each workspace object has an increment num as the attr name
//                    for (var attr in json) {
//                        if (json.hasOwnProperty(attr)) {
//                            var ws = new Workspace();
//                            ws.set("key",   json[attr].key);
//                            ws.set("alias", json[attr].alias);
//                            ws.set("user",  user);
//                            ws.set("status", json[attr].ready);
//                            ws.set("date", getDateString(json[attr].timestamp));
//
//                            workspaces.add(ws);
//
//                            if ((ws.get("status") == ReadyStatus.NOT_READY) && ($.inArray(ws.get("key"), notReadyKeys) == -1))
//                            {
//                                console.log("Adding auto-updates for key "  + ws.get("key"));
//                                notReadyKeys.push(ws.get("key"));
//                            }
//                        }
//                    }
//                },
//                error: function(jqXHR, textStatus)
//                {
//                    $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
//                }
//            });
//        }
    }

    /**
     * Deletes the specified index from the server and the local Backbone collection.
     *
     * @param workspace
     */
    function deleteWorkspace(index)
    {
        // TODO
        console.debug("Deleting index");
    }

    // public API
    return {

        /**
         * Refresh all workspaces from server.
         */
        refreshIndexes: refreshAllIndexes
    };

};