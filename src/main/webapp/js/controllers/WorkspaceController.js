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
     * Array of workspaceKey keys that should be updated automatically
     */
    notReadyKeys: new Array(),

    initialize: function (options) {

        var self = this;

        // Wire events to functions
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_REMOVE, function (workspaceKey) {
            self.removeWorkspace(workspaceKey);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_GROUP_CREATE, function (group, workspaceKey) {
            self.createSampleGroup(group, workspaceKey);
        });
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_REFRESH, function (workspaceKey) {
            self.refreshWorkspace(workspaceKey);
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
     * Show workspaces table and populate with latest workspaceKey data.
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

            // do not allow the user to change the workspaceKey while refresh is happening
            self.workspaceGroupLayout.disableDropdown();
            self.refreshAllWorkspaces();
            self.workspaceGroupLayout.enableDropdown();
        });
        this.listenTo(self.workspaceGroupLayout, self.workspaceGroupLayout.EVENT_ONE_GROUP, function (userGroup) {

            self.selectedUserGroup = userGroup;

            // do not allow the user to change the workspaceKey while refresh is happening
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
     * Gets a {@link Workspace} model that corresponds to the given key.
     * @param workspaceKey
     */
    getWorkspace: function(workspaceKey) {
        return this.workspaces.findWhere({key: workspaceKey});
    },

    /**
     * Refreshes a specific {@link Workspace} model by querying the server.
     *
     * NOTE: this is synchronous
     *
     * @param workspaceKey
     */
    refreshWorkspace: function(workspaceKey) {

        // synchronous
        var async = false;

        console.log("refreshing workspaceKey " + workspaceKey);

        var ws = this.getWorkspace(workspaceKey);

        // get workspaceKey information from server
        var self = this;
        $.ajax({
            url: "/mongo_svr/ve/meta/workspace/" + workspaceKey,
            dataType: "json",
            async: async,
            success: function(workspaceJSON) {

                self.initWorkspace(workspaceJSON, ws, async);

            },
            error: jqueryAJAXErrorHandler
        });
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
                            self.workspaces.add(ws);
                            console.log("workspace:");
                            console.log("\tname:\t"+ws.get("alias"));
                            console.log("\tkey :\t"+ws.get("key"));
                        }
                    }
                }
            },
            error: jqueryAJAXErrorHandler
        });
    },

    initWorkspace: function(workspaceJSON, ws, async) {

        // each workspaceKey object has an increment num as the attr name
        ws.set("key",   workspaceJSON.key);
        ws.set("alias", workspaceJSON.alias);
        ws.set("status", workspaceJSON.ready);
        ws.set("date", getDateString(workspaceJSON.timestamp));

        if (workspaceJSON.STATISTICS != undefined) {
            ws.set("statsErrors", parseInt(workspaceJSON.STATISTICS.ERRORS));
            ws.set("statsWarnings", parseInt(workspaceJSON.STATISTICS.WARNINGS));
            ws.set("statsNumVariants", parseInt(workspaceJSON.STATISTICS.data_line_count));
        } else {
            var variant_count_total = parseInt(workspaceJSON.variant_count_total);
            if (!isNaN(variant_count_total)) {
                ws.set("statsTotalVariants", variant_count_total);
            }

            var variant_count_current = parseInt(workspaceJSON.variant_count_current);
            if (!isNaN(variant_count_current)) {
                ws.set("statsNumVariants", variant_count_current);
            }
        }

        var annotation_count_total = parseInt(workspaceJSON.annotation_count_total);
        if (!isNaN(annotation_count_total)) {
            ws.set("statsTotalAnnotations", annotation_count_total);
        }

        var annotation_count_current = parseInt(workspaceJSON.annotation_count_current);
        if (!isNaN(annotation_count_current)) {
            ws.set("statsNumAnnotations", annotation_count_current);
        }

        // load extra information about workspaceKey
        this.loadMetadata(ws, async);
        this.loadSampleGroups(ws, async);
        this.loadSamples(ws, async);

        // auto-update if the workspace is not 'ready' or 'failed'
        if ( !((ws.get("status") == ReadyStatus.READY) || (ws.get("status") == ReadyStatus.FAILED))
            && ($.inArray(ws.get("key"), this.notReadyKeys) == -1)) {
            console.log("Adding auto-updates for key "  + ws.get("key"));
            this.notReadyKeys.push(ws.get("key"));
        }
    },

    updateNotReadyWorkspaces: function()
    {
        var self = this;

        if (this.notReadyKeys.length == 0) {
            return;
        }

        // get workspaceKey information from server
        $.ajax({
            url: "/mongo_svr/ve/q/owner/list_workspaces/" + MongoApp.securityController.user.get("username"),
            dataType: "json",
            headers: {usertoken: MongoApp.securityController.user.get("token")},
            success: function(json) {

                // each workspaceKey object has an increment num as the attr name
                for (var attr in json) {
                    if (json.hasOwnProperty(attr)) {
                        var workspaceJSON = json[attr];
                        var key = workspaceJSON.key;

                        if($.inArray(key, self.notReadyKeys) != -1) {
                            console.log("updating status for key " + key);
                            var ws = self.getWorkspace(key);
                            self.initWorkspace(workspaceJSON, ws, true);

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
     * Uploads a VCF to the server to create a new workspaceKey.
     */
    addWorkspace: function() {
        var self = this;

        var uploadFile = $( '#vcf_file_upload' )[0].files[0]

        var name = $("#vcf_name_field").val();
        console.debug("Adding workspaceKey with name=" + name);

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
                // this will include the newly imported workspaceKey
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
     * Deletes the specified workspaceKey from the server and the local Backbone collection.
     *
     * @param workspaceKey
     */
    removeWorkspace: function(workspaceKey) {
        var workspace = this.getWorkspace(workspaceKey);

        console.debug("Deleting working with name=" + workspace.get("alias") + " and key=" + workspaceKey);

        var self = this;

        try {
            // STEP #1: Delete the workspaceKey in mongodb
            $.ajax({
                type: "DELETE",
                url: "/mongo_svr/ve/delete_workspace/" + workspaceKey,
                async: false,
                success: function() {
                    console.log("Deleted workspaceKey from mongodb with key: " + workspaceKey);
                    self.workspaces.remove(workspace);

                    // check for case where user deletes the workspace they currently are analyzing
                    if (workspaceKey == MongoApp.workspaceKey) {
                        // close tab
                        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_CLOSE);
                    }
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
     * Loads metadata to the given workspaceKey model.
     *
     * @param workspace
     */
    loadMetadata: function(workspace, async) {
        var self = this;

        $.ajax({
            url: "/mongo_svr/ve/meta/workspace/" + workspace.get("key"),
            dataType: "json",
            async: async,
            success: function(json)
            {
                var generalDataFields = new VCFDataFieldList();
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'CHROM',  description:'The chromosome.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'POS',    description:'The reference position, with the 1st base having position 1.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'ID',     description:'Semi-colon separated list of unique identifiers.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'REF',    description:'The reference base(s). Each base must be one of A,C,G,T,N (case insensitive).'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'ALT',    description:'Comma separated list of alternate non-reference alleles called on at least one of the samples.'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'QUAL',   description:'Phred-scaled quality score for the assertion made in ALT. i.e. -10log_10 prob(call in ALT is wrong).'}));
                generalDataFields.add(new VCFDataField({category: VCFDataCategory.GENERAL, name:'FILTER', description:'PASS if this position has passed all filterSteps, i.e. a call is made at this position. Otherwise, if the site has not passed all filterSteps, a semicolon-separated list of codes for filterSteps that fail. e.g. “q10;s50” might indicate that at this site the quality is below 10 and the number of samples with data is below 50% of the total number of samples.'}));


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
    loadSamples: function(workspace, async) {

        $.ajax({
            url: "/mongo_svr/SampleMeta/" + workspace.get("key"),
            dataType: "json",
            async: async,
            success: function(json)
            {
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
                var type = null;

                if (metaJSON[fieldName].type == "Integer")
                    type = SampleMetadataFieldType.INTEGER;

                if (metaJSON[fieldName].type == "Float")
                    type = SampleMetadataFieldType.FLOAT;

                if (metaJSON[fieldName].type == "Flag")
                    type = SampleMetadataFieldType.BOOLEAN;

                if (metaJSON[fieldName].type == "String")
                    type = SampleMetadataFieldType.STRING;

                var description = metaJSON[fieldName].Description;
                fields.add(new VCFDataField({id:fieldName, type:type, desc:description}));
            }
        }

        return fields;
    },

    /**
     * Loads Sample Groups for the specified workspaceKey.
     *
     * @param workspace
     */
    loadSampleGroups: function(workspace, async) {

        workspace.get("sampleGroups").reset();

        $.ajax({
            url: "/mongo_svr/ve/samples/groups/w/" + workspace.get("key"),
            dataType: "json",
            async: async,
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

    createSampleGroup: function(group, workspaceKey)
    {
        var workspace = MongoApp.workspaceController.getWorkspace(workspaceKey);

        // translate backbone model to pojo expected by server
        var pojo = {};
        pojo.workspace   = workspaceKey;
        pojo.alias       = group.get("name");
        pojo.description = group.get("description");
        pojo.samples     = group.get("sampleNames");

        console.debug("Saving group: " + JSON.stringify(pojo));

        $.ajax({
            type: "POST",
            url: "/mongo_svr/ve/samples/savegroup",
            contentType: "application/json",
            data: JSON.stringify(pojo),
            success: function()
            {
                console.debug("saved group: " + pojo.alias);

                workspace.get("sampleGroups").add(group);
            },
            error: jqueryAJAXErrorHandler
        });
    }
});