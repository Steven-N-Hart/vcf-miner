/**
 * Controller for VCF data.
 * @type {*}
 */
var VariantDataController = Backbone.Marionette.Controller.extend({

    /**
     * metadata about the variant table columns
     */
    varTableCols: new VariantTableColumnList(),

    /**
     * data for the variant table
     */
    varTableRows: new VariantTableRowList(),

    initialize: function (options) {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.SEARCH_CHANGED, function (search, async) {
            self.changedSearch(search, async);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_CHANGE, function (workspace) {
            self.changeWorkspace(workspace);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_DOWNLOAD, function (workspace, search) {
            self.download(workspace, search);
        });
    },

    showVariantTable: function (options) {

        // create a new view for variant table
        this.variantTableView = new VariantTableDataView({
            model:        this.varTableRows,
            columns:      this.varTableCols
        });

        new VariantTableColumnView({model: this.varTableCols});

        options.region.show(this.variantTableView);
    },

    changedSearch: function (search, async) {
        this.refreshData(MongoApp.workspace, search, async);
    },

    /**
     * Uses the current Search model and re-executes a server-side query to get the latest
     * VCF data.
     *
     * @param workspace
     * @param search
     * @param async
     *      Determines whether this is executed asynchronously or not.
     */
    refreshData: function(workspace, search, async) {
        // send query request to server
        var query = buildQuery(search.get("filterSteps"), workspace.get("key"));
        this.sendQuery(query, async);
    },



    /**
     * Sends query to server via AJAX.
     *
     * @param query
     * @param async
     *      Determines whether this is executed asynchronously or not.
     */
    sendQuery: function(query, async)
    {
        this.varTableRows.reset();

        var self = this;

//        var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h3>Running Filters.  Please wait...</h3></div><div class="modal-body"></div></div>');
//        pleaseWaitDiv.modal();

        console.debug("Sending query to server:" + JSON.stringify(query));

        MongoApp.showPleaseWait();

        $.ajax({
            type: "POST",
            url: "/mongo_svr/ve/eq",
            contentType: "application/json",
            data: JSON.stringify(query),
            dataType: "json",
            async: async,
            success: function(json)
            {
                console.debug("Query returned " + json.totalResults + " results");

                if (typeof json.mongoQuery !== "undefined") {
                    console.debug("Mongo Query: " + json.mongoQuery);
                }

                var variants = json.results;
                for (var i = 0; i < variants.length; i++) {
                    var variant = variants[i];

                    // extract row values
                    var rowValues = new Array();

                    // loop through collection
                    _.each(self.varTableCols.models, function(col) {
                        var name = col.get("name");

                        if (name.substring(0, 4) === 'INFO') {
                            // INFO column
                            var infoFieldName = col.get("displayName");
                            var variantInfo = variant['INFO'];
                            if(variantInfo[infoFieldName] !== undefined) {
                                rowValues.push(variantInfo[infoFieldName]);
                            }
                            else {
                                rowValues.push("");
                            }
                        }
                        else if (name.substring(0, 6) === 'FORMAT') {
                            // FORMAT column
                            var formatFieldName = col.get("name").substring(7);
                            var rowValue = "";
                            if (variant.hasOwnProperty('FORMAT')) {
                                var variantFormat = variant['FORMAT'];
                                if(variantFormat.hasOwnProperty(formatFieldName) && (variantFormat[formatFieldName] !== undefined)) {
                                    rowValue = variantFormat[formatFieldName];
                                }
                            }
                            rowValues.push(rowValue);
                        }
                        else {
                            rowValues.push(variant[name]);
                        }
                    });
                    self.varTableRows.add(new VariantTableRow({"values": rowValues}));
                }
                self.varTableRows.trigger("finalize");

                // update count on LAST Filter only
                var lastFilter = _.last(MongoApp.search.get("filterSteps").models);
                lastFilter.set("numMatches", json.totalResults);

                if (json.totalResults > MongoApp.settings.maxFilteredVariants) {
                    var m = 'Loaded only ' +  MongoApp.settings.maxFilteredVariants;
                    var numMatchesLabel = $('#' + lastFilter.get("id") + "_num_matches_label");
                    numMatchesLabel.popover('destroy');
                    numMatchesLabel.popover(
                        {
                            html: true,
                            content: _.template($("#warning-popover-template").html(), {message: m})
                        }
                    );
                    numMatchesLabel.popover('show');
                    setTimeout(function(){ numMatchesLabel.popover('hide'); }, MongoApp.settings.popupDuration * 1000);
                }
            },
            error: jqueryAJAXErrorHandler,
            complete: function(jqXHR, textStatus) {
                setTimeout(function(){MongoApp.closePleaseWait();}, 500);
            }
        });
    },

    /**
     * Updates models based on the workspace selection changing.
     *
     * @param workspace
     */
    changeWorkspace: function(workspace)
    {
        var self = this;

        this.varTableCols.reset();

        // TODO: switch VariantTableColumn to use these VCFDataField models
        // standard 1st 7 VCF file columns
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'CHROM',  displayName:'CHROM',  description:'The chromosome.'}));
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'POS',    displayName:'POS',    description:'The reference position, with the 1st base having position 1.'}));
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'ID',     displayName:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'REF',    displayName:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'ALT',    displayName:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
        this.varTableCols.add(new VariantTableColumn({visible:false, name:'QUAL',   displayName:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
        this.varTableCols.add(new VariantTableColumn({visible:false, name:'FILTER', displayName:'FILTER', description:'PASS if this position has passed all filterSteps, i.e. a call is made at this position. Otherwise, if the site has not passed all filterSteps, a semicolon-separated list of codes for filterSteps that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'FORMAT.GenotypePostitiveCount', displayName:'#_Samples', description:'The number of samples.'}));
        this.varTableCols.add(new VariantTableColumn({visible:true,  name:'FORMAT.GenotypePositiveList',  displayName:'Samples',   description:'The names of samples.'}));
        // update VariantTableColumn models to include info fields
        _.each(workspace.get("dataFields").where({category: VCFDataCategory.INFO}), function(infoDataField) {
            var infoFieldName = infoDataField.get("name");
            var infoFieldDescription = infoDataField.get("description");
            self.varTableCols.add(new VariantTableColumn({visible:false,  name:'INFO.'+infoFieldName,  displayName:infoFieldName,   description:infoFieldDescription}));
        });

        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_META_LOADED);
    },

    /**
     * Downloads data in TSV format for the given query and selected columns.
     */
    download: function(workspace, search)
    {
        // send query request to server
        var query = buildQuery(search.get("filterSteps"), workspace.get("key"));

        var returnFields = new Array();
        var displayFields = new Array();
        var order = this.variantTableView.getColumnOrderHash();
        for (var currentIdx = 0; currentIdx < order.length; currentIdx++) {
            var originalIdx = order[currentIdx];

            var col = this.varTableCols.models[originalIdx];
            if ( col.get("visible") ) {
                returnFields.push(col.get("name"));
                displayFields.push(col.get("displayName"));
            }
        }

        query.returnFields = returnFields;
        query.displayFields = displayFields;

        var displayFiltersApplied = new Array();
        _.each(search.get("filterSteps").models, function(filter)
        {
            displayFiltersApplied.push(
                {
                    filterText: filter.getNameAsASCII() + " " + filter.getOperatorAsASCII() + " " + filter.getValueAsASCII(),
                    numberVariantsRemaining: filter.get("numMatches")
                }
            );
        });
        query.displayFiltersApplied = displayFiltersApplied;

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
});