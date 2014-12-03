/**
 * Controller for workspace data.
 * @type {*}
 */
var WorkspaceController = Backbone.Marionette.Controller.extend({

    /**
     * Backbone collection of Workspace models.
     */
    workspaces: new WorkspaceList(),

    /**
     * Currently selected group.  NULL if All groups are selected.
     */
    selectedUserGroup: null,

    /**
     * Array of workspace keys that should be updated automatically
     */
    notReadyKeys: new Array(),

    initialize: function (options) {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_REMOVE, function (workspace) {
            self.removeWorkspace(workspace);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_GROUP_CREATE, function (group, workspace) {
            self.createSampleGroup(group, workspace);
        });

        // automatic polling to update "not ready" workspaces
        var TIMER_INTERVAL = 10000; // 10 seconds
        setInterval(this.updateNotReadyWorkspaces.bind(this), TIMER_INTERVAL);

        // jQuery validate plugin config
        $('#import_vcf_form').validate( {
                rules: {
                    vcf_file_upload: {
                        required: true,
                        minlength: 1
                    },
                    vcf_name_field: {
                        required: true,
                        minlength: 1
                    }
                },
                submitHandler: function(form) {

                    // hide add dialog
                    $('#add_workspace_modal').modal('hide');

                    self.addWorkspace();
                },
                highlight: function(element) {
                    $(element).parent().addClass('control-group error');
                },
                success: function(element) {
                    $(element).parent().removeClass('control-group error');
                }
         });

        // initialize the file input field, blank out button text
        $(":file").filestyle({buttonText: ''});

        // listen for when the user selects a file
        $( "#vcf_file_upload" ).change( function()
        {
            var uploadFile = $( '#vcf_file_upload' )[0].files[0]

            // some browsers put C:\\fakepath\\ on the front
            var name = uploadFile.name.replace("C:\\fakepath\\", "");

            // by default, set the name to be the filename
            $('#vcf_name_field').val(name);

            // focus on input field and highlight text
            $('#vcf_name_field').focus();
            $('#vcf_name_field').select();
        });
    },

    /**
     * Resets the state of this controller.
     */
    reset: function() {
        this.workspaces.reset();
        this.notReadyKeys = new Array();
    },

    /**
     * Show workspaces table and populate with latest workspace data.
     *
     * @param options
     */
    showWorkspaceTable: function (options) {

        var workspaceTableView = new WorkspaceTableView({
            collection: this.workspaces
        });
        options.regionTable.show(workspaceTableView);


        this.workspaceGroupLayout = new WorkspaceDropdownView({
            collection: MongoApp.securityController.userGroups
        });
        options.regionGroup.show(this.workspaceGroupLayout);

        var self = this;
        this.listenTo(self.workspaceGroupLayout, self.workspaceGroupLayout.EVENT_ALL_GROUPS, function (userGroups) {

            self.selectedUserGroup = null; // NULL indicates all user groups

            // do not allow the user to change the workspace while refresh is happening
            self.workspaceGroupLayout.disableDropdown();
            self.refreshAllWorkspaces();
            self.workspaceGroupLayout.enableDropdown();
        });
        this.listenTo(self.workspaceGroupLayout, self.workspaceGroupLayout.EVENT_ONE_GROUP, function (userGroup) {

            self.selectedUserGroup = userGroup;

            // do not allow the user to change the workspace while refresh is happening
            self.workspaceGroupLayout.disableDropdown();
                self.refreshAllWorkspaces();
            self.workspaceGroupLayout.enableDropdown();
        });

        // initial fetch of data
        this.workspaceGroupLayout.disableDropdown();
        this.refreshAllWorkspaces();
        this.workspaceGroupLayout.enableDropdown();
    },

    /**
     * Refreshes the Backbone collection of workspaces by querying the server.
     *
     * NOTE: This function is synchronous.
     */
    refreshAllWorkspaces: function() {

        console.log("refreshing all workspaces");

        // clear out workspaces
        this.workspaces.reset();

        var userToken = MongoApp.securityController.user.get("token");

        // Keys of workspaces allowed in {@link WorkspaceController.workspaces}
        // NULL indicates that all workspaces are allowed.
        var filterKeys = null;
        if (this.selectedUserGroup != null) {
            filterKeys = MongoApp.securityController.getAuthorizedWorkspaceKeys(userToken, this.selectedUserGroup);
        }

        var self = this;

        // get workspace information from server
        $.ajax({
            url: "/mongo_svr/ve/q/owner/list_workspaces/" + MongoApp.securityController.user.get("username"),
            headers: {usertoken: userToken},
            dataType: "json",
            async: false,
            success: function(json) {

                // each workspace object has an increment num as the attr name
                for (var attr in json) {
                    if (json.hasOwnProperty(attr)) {

                        var workspaceJSON = json[attr];

                        // check filtered keys
                        if ((filterKeys == null) || _.contains(filterKeys, workspaceJSON.key)) {
                            var ws = new Workspace();

                            self.initWorkspace(workspaceJSON, ws);

                            console.log("workspace:");
                            console.log("\tname:\t"+ws.get("alias"));
                            console.log("\tkey :\t"+ws.get("key"));

                            self.workspaces.add(ws);

                            // auto-update if the workspace is 'not ready' or 'queued'
                            if (((ws.get("status") == ReadyStatus.NOT_READY) || (ws.get("status") == ReadyStatus.QUEUED))
                                && ($.inArray(ws.get("key"), self.notReadyKeys) == -1)) {
                                console.log("Adding auto-updates for key "  + ws.get("key"));
                                self.notReadyKeys.push(ws.get("key"));
                            }
                        }
                    }
                }
            },
            error: jqueryAJAXErrorHandler
        });
    },

    initWorkspace: function(workspaceJSON, ws) {
        // each workspace object has an increment num as the attr name
        ws.set("key",   workspaceJSON.key);
        ws.set("alias", workspaceJSON.alias);
        ws.set("status", workspaceJSON.ready);
        ws.set("date", getDateString(workspaceJSON.timestamp));

        if (workspaceJSON.STATISTICS != undefined) {
            ws.set("statsErrors", parseInt(workspaceJSON.STATISTICS.ERRORS));
            ws.set("statsWarnings", parseInt(workspaceJSON.STATISTICS.WARNINGS));
            ws.set("statsNumVariants", parseInt(workspaceJSON.STATISTICS.data_line_count));
        }

        // load extra information about workspace
        this.loadMetadata(ws);
        this.loadSampleGroups(ws);
        this.loadSamples(ws);
    },

    updateNotReadyWorkspaces: function()
    {
        var self = this;

        if (this.notReadyKeys.length == 0) {
            return;
        }

        // get workspace information from server
        $.ajax({
            url: "/mongo_svr/ve/q/owner/list_workspaces/" + MongoApp.securityController.user.get("username"),
            dataType: "json",
            headers: {usertoken: MongoApp.securityController.user.get("token")},
            success: function(json) {

                // each workspace object has an increment num as the attr name
                for (var attr in json) {
                    if (json.hasOwnProperty(attr)) {
                        var workspaceJSON = json[attr];
                        var key = workspaceJSON.key;

                        if($.inArray(key, self.notReadyKeys) != -1) {
                            console.log("updating status for key " + key);
                            var ws = self.workspaces.findWhere({key: key});
                            self.initWorkspace(workspaceJSON, ws);

                            if ((ws.get("status") == ReadyStatus.READY) ||
                                (ws.get("status") == ReadyStatus.FAILED)) {
                                // delete key
                                var index = self.notReadyKeys.indexOf(key);
                                if (index > -1) {
                                    self.notReadyKeys.splice(index, 1);
                                }
                                console.log("Removing auto-updates for key "  + key);
                            }
                        }
                    }
                }
            },
            error: jqueryAJAXErrorHandler
        });
    },

    /**
     * Uploads a VCF to the server to create a new workspace.
     */
    addWorkspace: function() {
        var self = this;

        var uploadFile = $( '#vcf_file_upload' )[0].files[0]

        var name = $("#vcf_name_field").val();
        console.debug("Adding workspace with name=" + name);

        // progress on transfers from the server to the client (downloads)
        function updateProgress (oEvent) {
            if (oEvent.lengthComputable) {
                var percentComplete = (oEvent.loaded / oEvent.total) * 100;
                $("#progress").css('width',percentComplete + '%');
            }
        }

        var xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", updateProgress, false);

        xhr.open('POST', "/mongo_svr/uploadvcf/user/" + MongoApp.securityController.user.get("username") + "/alias/" + name, true);

        // setup HTTP request header key/value pairs
        xhr.setRequestHeader('file-compression', uploadFile.name);
        xhr.setRequestHeader('usertoken', MongoApp.securityController.user.get("token"));

        xhr.onload = function(oEvent) {
            if (xhr.status == 200) {
                console.log("Uploaded!");

                $("#progress").css('width','100%');

                // refresh the workspaces
                // this will include the newly imported workspace
                self.refreshAllWorkspaces();

                $('#upload_vcf_progress_modal').modal('hide');

            } else {
                console.log("Error " + xhr.status + " occurred uploading file");
                genericAJAXErrorHandler(xhr);
            }
        };

        var formData = new FormData;
        formData.append('file', uploadFile);

        $("#progress").css('width','0%');
        $('#upload_vcf_progress_modal').modal('show');

        xhr.send(formData);
    },

    /**
     * Deletes the specified workspace from the server and the local Backbone collection.
     *
     * @param workspace
     */
    removeWorkspace: function(workspace) {
        var workspaceKey = workspace.get("key");

        console.debug("Deleting working with name=" + workspace.get("alias") + " and key=" + workspaceKey);

        var self = this;

        try {
            // STEP #1: Delete the workspace in mongodb
            $.ajax({
                type: "DELETE",
                url: "/mongo_svr/ve/delete_workspace/" + workspaceKey,
                async: false,
                success: function() {
                    console.log("Deleted workspace from mongodb with key: " + workspaceKey);
                    self.workspaces.remove(workspace);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
                }
            });

            // STEP #2: Delete corresponding resource in securityuserapp
            $.ajax({
                type: "POST",
                url: "/securityuserapp/api/resources/delete/" + workspaceKey,
                headers: {usertoken: MongoApp.securityController.user.get("token")},
                data: {},
                dataType: "json",
                async: false,
                success: function() {
                    console.log("Deleted resource from securityuserapp with key: " + workspaceKey);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    throw new AJAXRequestException(jqXHR, textStatus, errorThrown);
                }
            });
        } catch (exception) {
            if (exception instanceof AJAXRequestException) {
                jqueryAJAXErrorHandler(exception.jqXHR, exception.textStatus, exception.errorThrown);
            } else {
                throw exception;
            }
        }
    },

    /**
     * Loads metadata to the given workspace model.
     *
     * @param workspace
     */
    loadMetadata: function(workspace) {
        var self = this;

        $.ajax({
            url: "/mongo_svr/ve/meta/workspace/" + workspace.get("key"),
            dataType: "json",
            success: function(json)
            {
                var generalDataFields = new VCFDataFieldList();
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'CHROM',  description:'The chromosome.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'POS',    description:'The reference position, with the 1st base having position 1.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'FILTER', description:'PASS if this position has passed all filters, i.e. a call is made at this position. Otherwise, if the site has not passed all filters, a semicolon-separated list of codes for filters that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));


                if (json.HEADER != undefined) {
                    var infoDataFields = self.toDataFields(json.HEADER.INFO, VCFDataCategory.INFO);
                    var formatDataFields = self.toDataFields(json.HEADER.FORMAT, VCFDataCategory.FORMAT);

                    // merge all data fields together into 1 collection
                    workspace.get("dataFields").reset();
                    workspace.get("dataFields").add(generalDataFields.models);
                    workspace.get("dataFields").add(infoDataFields.models);
                    workspace.get("dataFields").add(formatDataFields.models);

                    var sampleMetaFields = self.toSampleMetadataFields(json.HEADER.META);
                    workspace.get("sampleMetaFields").reset();
                    workspace.get("sampleMetaFields").add(sampleMetaFields.models);
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
                workspace.set("sampleNames", allSamples);
            },
            error: jqueryAJAXErrorHandler
        });
    },

    /**
     * Loads ##SAMPLE information
     *
     * @param workspace
     */
    loadSamples: function(workspace) {

        $.ajax({
            url: "/mongo_svr/SampleMeta/" + workspace.get("key"),
            dataType: "json",
            success: function(json)
            {
                console.log(JSON.stringify(json));

                var sampleArray = json.results;
                for (var i = 0; i < sampleArray.length; i++) {
                    var serverSideSample = sampleArray[i];
                    // translate to Sample model
                    var sample = new Sample();
                    sample.set("name", serverSideSample.name);

                    var keyValPairs = new Object();
                    for (var key in serverSideSample.integerVals) {
                        keyValPairs[key] = serverSideSample.integerVals[key];
                    }
                    for (var key in serverSideSample.floatVals) {
                        keyValPairs[key] = serverSideSample.floatVals[key];
                    }
                    for (var key in serverSideSample.stringVals) {
                        keyValPairs[key] = serverSideSample.stringVals[key];
                    }
                    for (var key in serverSideSample.booleanVals) {
                        var boolArray = new Array();
                        boolArray.push(serverSideSample.booleanVals[key]);
                        keyValPairs[key] = boolArray;
                    }
                    sample.set("sampleMetadataFieldKeyValuePairs", keyValPairs);

                    workspace.get("samples").add(sample);
                }

            },
            error: jqueryAJAXErrorHandler
        });
    },

    /**
     * Parses JSON and builds a collection {@link VCFDataField} models.
     *
     * @param infoOrFormat
     *      JSON that contains INFO or FORMAT information.
     * @param category
     *
     * @returns {VCFDataFieldList}
     */
    toDataFields: function(infoOrFormat, category) {
        var dataFields = new VCFDataFieldList();

        var fieldNames = getSortedAttrNames(infoOrFormat);
        for (var i = 0; i < fieldNames.length; i++) {
            var fieldName = fieldNames[i];
            if (infoOrFormat.hasOwnProperty(fieldName)) {
                var type;
                switch(infoOrFormat[fieldName].type) {
                    case 'Flag':
                        type = VCFDataType.FLAG;
                        break;
                    case 'Integer':
                        type = VCFDataType.INTEGER;
                        break;
                    case 'Float':
                        type = VCFDataType.FLOAT;
                        break;
                    default:
                        type = VCFDataType.STRING;
                        break;
                }
                var name = fieldName;
                var description = infoOrFormat[fieldName].Description;
                dataFields.add(new VCFDataField({category:category, type:type, name:name, description:description}));
            }
        }

        return dataFields;
    },

    /**
     * Parses JSON and builds a collection {@link SampleMetadataField} models.
     *
     * @param metaJSON
     *      JSON that contains ##META information.
     *
     * @returns {SampleMetadataFieldList}
     */
    toSampleMetadataFields: function(metaJSON) {

        var fields = new SampleMetadataFieldList();

        var fieldNames = getSortedAttrNames(metaJSON);
        for (var i = 0; i < fieldNames.length; i++) {
            var fieldName = fieldNames[i];
            if (metaJSON.hasOwnProperty(fieldName)) {
                var type;
                switch(metaJSON[fieldName].type) {
                    case 'Flag':
                        type = SampleMetadataFieldType.FLAG;
                        break;
                    case 'Integer':
                        type = SampleMetadataFieldType.INTEGER;
                        break;
                    case 'Float':
                        type = SampleMetadataFieldType.FLOAT;
                        break;
                    default:
                        type = SampleMetadataFieldType.STRING;
                        break;
                }
                var description = metaJSON[fieldName].Description;
                fields.add(new VCFDataField({id:fieldName, type:type, desc:description}));
            }
        }

        return fields;
    },

    /**
     * Loads Sample Groups for the specified workspace.
     *
     * @param workspace
     */
    loadSampleGroups: function(workspace) {

        workspace.get("sampleGroups").reset();

        $.ajax({
            url: "/mongo_svr/ve/samples/groups/w/" + workspace.get("key"),
            dataType: "json",
            success: function(json) {
                var groupArray = json.sampleGroups;
                for (var i = 0; i < groupArray.length; i++) {
                    // translate to SampleGroup model
                    var group = new SampleGroup();
                    group.set("name",        groupArray[i].alias);
                    group.set("description", groupArray[i].description);
                    group.set("sampleNames", groupArray[i].samples);

                    workspace.get("sampleGroups").add(group);
                }
            },
            error: jqueryAJAXErrorHandler
        });
    },

    createSampleGroup: function(group, workspace)
    {
        // translate backbone model to pojo expected by server
        var pojo = {};
        pojo.workspace   = workspace.get("key");
        pojo.alias       = group.get("name");
        pojo.description = group.get("description");
        pojo.samples     = group.get("sampleNames");

        console.debug("Saving group: " + JSON.stringify(pojo));

        $.ajax({
            type: "POST",
            url: "/mongo_svr/ve/samples/savegroup",
            contentType: "application/json",
            data: JSON.stringify(pojo),
            dataType: "json",
            success: function(json)
            {
                console.debug("saved group: " + pojo.alias);

                workspace.get("sampleGroups").add(group);

                MongoApp.dispatcher.trigger(MongoApp.events.WKSP_CHANGE, workspace);
            },
            error: jqueryAJAXErrorHandler
        });
    }
});