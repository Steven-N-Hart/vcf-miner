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
     * Array of strings that represent user names.
     */
    users: new Array(),

    /**
     * Array of workspace keys that should be updated automatically
     */
    notReadyKeys: new Array(),

    initialize: function (options) {

        var self = this;

        // Wire events to functions
        MongoApp.on("workspaceRemove", function (workspace) {
            self.removeWorkspace(workspace);
        });
        MongoApp.on("workspaceGroupCreate", function (group) {
            self.createSampleGroup(group, MongoApp.workspace);
        });

        // TODO: users hardcoded
        this.users.push('steve');
        this.users.push('dan');

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
                    self.addWorkspace();
                    $('#add_workspace_modal').modal('hide')
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
     * Show workspaces table and populate with latest workspace data.
     *
     * @param options
     */
    showWorkspaceTable: function (options) {
        var workspaceTableView = new WorkspaceTableView({
            collection: this.workspaces
        });

        options.region.show(workspaceTableView);

        this.refreshAllWorkspaces();
    },

    /**
     * Refreshes the Backbone collection of workspaces by querying the server.
     */
    refreshAllWorkspaces: function() {

        console.log("refreshing all workspaces");

        var self = this;

        // clear out workspaces
        this.workspaces.reset();

        // perform REST call per-user
        for (var i = 0; i < this.users.length; i++) {
            var user = this.users[i];
            // get workspace information from server
            $.ajax({
                url: "/mongo_svr/ve/q/owner/list_workspaces/" + user,
                dataType: "json",
                success: function(json) {

                    // each workspace object has an increment num as the attr name
                    for (var attr in json) {
                        if (json.hasOwnProperty(attr)) {

                            var workspaceJSON = json[attr];

                            var ws = new Workspace();

                            self.initWorkspace(user, workspaceJSON, ws);

                            self.workspaces.add(ws);

                            if ((ws.get("status") == ReadyStatus.NOT_READY) && ($.inArray(ws.get("key"), self.notReadyKeys) == -1)) {
                                console.log("Adding auto-updates for key "  + ws.get("key"));
                                self.notReadyKeys.push(ws.get("key"));
                            }
                        }
                    }
                },
                error: function(jqXHR, textStatus) {
                    MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
                }
            });
        }
    },

    initWorkspace: function(user, workspaceJSON, ws) {
        // each workspace object has an increment num as the attr name
        ws.set("key",   workspaceJSON.key);
        ws.set("alias", workspaceJSON.alias);
        ws.set("user",  user);
        ws.set("status", workspaceJSON.ready);
        ws.set("date", getDateString(workspaceJSON.timestamp));

        // load extra information about workspace
        this.loadMetadata(ws);
        this.loadSampleGroups(ws);
    },

    updateNotReadyWorkspaces: function()
    {
        var self = this;

        if (this.notReadyKeys.length == 0) {
            return;
        }

        // perform REST call per-user
        for (var i = 0; i < this.users.length; i++) {
            var user = this.users[i];
            // get workspace information from server
            $.ajax({
                url: "/mongo_svr/ve/q/owner/list_workspaces/" + user,
                dataType: "json",
                success: function(json) {

                    // each workspace object has an increment num as the attr name
                    for (var attr in json) {
                        if (json.hasOwnProperty(attr)) {
                            var workspaceJSON = json[attr];
                            var key = workspaceJSON.key;

                            if($.inArray(key, self.notReadyKeys) != -1) {
                                console.log("updating status for key " + key);
                                var ws = self.workspaces.findWhere({key: key});
                                self.initWorkspace(user, workspaceJSON, ws);

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
                error: function(jqXHR, textStatus) {
                    MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
                }
            });
        }
    },

    /**
     * Uploads a VCF to the server to create a new workspace.
     */
    addWorkspace: function() {
        var self = this;

        $("#progress").css('width','0%');

        // TODO: hardcoded user
        var user = 'steve';

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

        xhr.open('POST', "/mongo_svr/uploadvcf/user/" + user + "/alias/" + name, true);

        // setup HTTP request header key/value pairs
        xhr.setRequestHeader('file-compression', uploadFile.name);

        xhr.onload = function(oEvent) {
            if (xhr.status == 200) {
                console.log("Uploaded!");

                $("#progress").css('width','100%');

                self.refreshAllWorkspaces();
            } else {
                MongoApp.trigger(MongoApp.events.ERROR, "Error " + xhr.status + " occurred uploading your file.");
            }
            $('#upload_vcf_progress_modal').modal('hide');
        };

        var formData = new FormData;
        formData.append('file', uploadFile);
        xhr.send(formData);

        // hide
        $('#add_workspace_modal').modal('hide');

        // display
        $('#upload_vcf_progress_modal').modal();
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
        $.ajax({
            type: "DELETE",
            url: "/mongo_svr/ve/delete_workspace/" + workspaceKey,
            success: function(json) {
                self.workspaces.remove(workspace);
            },
            error: function(jqXHR, textStatus) {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
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
            error: function(jqXHR, textStatus)
            {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
    },

    /**
     *
     * @param infoOrFormat
     * @param category
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
                console.debug(json);
                console.debug("Number of groups: " + groupArray.length);
                for (var i = 0; i < groupArray.length; i++) {
                    // translate to SampleGroup model
                    var group = new SampleGroup();
                    group.set("name",        groupArray[i].alias);
                    group.set("description", groupArray[i].description);
                    group.set("sampleNames", groupArray[i].samples);

                    workspace.get("sampleGroups").add(group);
                }
            },
            error: function(jqXHR, textStatus) {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
    },

    createSampleGroup: function(group, workspace)
    {
        // translate backbone model to pojo expected by server
        var pojo = group.toSampleGroupPOJO(workspace.get("key"));

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
            },
            error: function(jqXHR, textStatus)
            {
                MongoApp.trigger(MongoApp.events.ERROR, JSON.stringify(jqXHR));
            }
        });
    }


});