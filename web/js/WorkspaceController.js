var WorkspaceController = function (fnSetWorkspaceCallback) {

    // private vars
    var workspaces = new WorkspaceList();

    var users = new Array(); // TODO: users hardcoded - need authentication?
    users.push('steve');
    users.push('dan');

    // listen for import workspace button presses
    $('#import_workspace_button').click(function (e)
    {
        addWorkspace();
    });

    /**
     * Single row in table.
     * @type {*}
     */
    var RowView = Backbone.View.extend({

        tagName: "tr",

        template: _.template($('#workspaces-template').html()),

        initialize: function()
        {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function()
        {
            // set id
            $(this.el).attr('id', this.model.get("id"));

            $(this.el).attr('type', 'data_row');

            this.model.set("displayStatus", getDisplayStatus(this.model));

            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    /**
     * Overall view for entire table.  Contains a nested view per row.
     * @type {*}
     */
    var TableView = Backbone.View.extend({

        el: $("#workspaces_view"),

        initialize: function()
        {
            this.listenTo(workspaces, 'add',    this.addOne);
            this.listenTo(workspaces, 'remove', this.removeOne);
            this.listenTo(workspaces, 'reset',  this.removeAll);
        },

        render: function()
        {
        },

        addOne: function(workspace)
        {
            var view = new RowView({model: workspace});

            // add right before the Add Filter button row
            $("#add_workspace_row").before(view.render().el);

            // register event listeners
            $('#' + workspace.get("id") + '_load_button').click(function (e)
            {
                // move the workspaces pane
                movePane();

                fnSetWorkspaceCallback(workspace);
            });
            $('#' + workspace.get("id") + '_delete_button').click(function (e)
            {
                deleteWorkspace(workspace);
            });

        },

        removeOne: function(workspace)
        {
            // remove element with corresponding group ID from DOM
            $("#" + workspace.get("id")).remove();
        },

        removeAll: function()
        {
            // remove all rows except for the add button row
            this.$("tr[type='data_row']").each(function() {
                $( this ).remove();
            });
        }
    });

    view = new TableView();

    /**
     * Gets human readable display status for the given workspace.
     *
     * @param workspace
     * @returns {string}
     */
    function getDisplayStatus(workspace)
    {
        switch(workspace.get("status"))
        {
            case ReadyStatus.NOT_READY:
                return "Processing";
            case ReadyStatus.READY:
                return "Available";
            case ReadyStatus.FAILED:
                return "Failed";
            default:
                return "NA";
        }
    }

    /**
     * Move workspaces pane from getting_started screen to workspace screen
     */
    function movePane()
    {
        var workspacesPane = $("#workspaces_pane").detach();
        var placeholder = $("#workspaces_placeholder");
        placeholder.append(workspacesPane);
    }

    /**
     * Refreshes the Backbone collection of workspaces by querying the server.
     */
    function refreshWorkspaces()
    {
        // clear out workspaces
        workspaces.reset();

        // perform REST call per-user
        for (var i = 0; i < users.length; i++)
        {
            var user = users[i];
            // get workspace information from server
            var workspaceRequest = $.ajax({
                url: "/mongo_svr/ve/q/owner/list_workspaces/" + user,
                dataType: "json",
                success: function(json)
                {
                    // each workspace object has an increment num as the attr name
                    for (var attr in json) {
                        if (json.hasOwnProperty(attr)) {
                            var ws = new Workspace();
                            ws.set("key",   json[attr].key);
                            ws.set("alias", json[attr].alias);
                            ws.set("user",  user);
                            ws.set("status", json[attr].ready);
                            workspaces.add(ws);
                        }
                    }
                },
                error: function(jqXHR, textStatus)
                {
                    $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
                }
            });
        }
    }

    /**
     * Uploads a VCF to the server to create a new workspace.
     */
    function addWorkspace()
    {
        $("#progress").css('width','0%');

        // TODO: hardcoded user
        var user = 'steve';

        var uploadFile = $( '#vcf_file_upload' )[0].files[0]

        // some browsers put C:\\fakepath\\ on the front
        var name = uploadFile.name.replace("C:\\fakepath\\", "");
        // chomp off trailing .vcf file extension
        name = name.replace(new RegExp('\.vcf'), '');
        console.debug("Adding working with name=" + name);

        // progress on transfers from the server to the client (downloads)
        function updateProgress (oEvent)
        {
            if (oEvent.lengthComputable)
            {
                var percentComplete = (oEvent.loaded / oEvent.total) * 100;
                $("#progress").css('width',percentComplete + '%');
            }
        }

        //    function transferComplete(evt)
        //    {
        //        alert("The transfer is complete.");
        //    }

        //    function transferFailed(evt)
        //    {
        //        alert("An error occurred while transferring the file.");
        //    }

        var xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", updateProgress, false);
        //xhr.addEventListener("load", transferComplete, false);
        //xhr.addEventListener("error", transferFailed, false);

        xhr.open('POST', "/mongo_svr/uploadvcf/user/" + user + "/alias/" + name, true);

        xhr.onload = function(oEvent)
        {
            if (xhr.status == 200)
            {
                console.log("Uploaded!");

                $("#progress").css('width','100%');

                // refresh workspaces
                refreshWorkspaces(workspaces);
            } else
            {
                console.log("Error " + xhr.status + " occurred uploading your file.<br \/>");
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
    }

    /**
     * Deletes the specified workspace from the server and the local Backbone collection.
     *
     * @param workspace
     */
    function deleteWorkspace(workspace)
    {
        var workspaceKey = workspace.get("key");

        console.debug("Deleting working with name=" + workspace.get("alias") + " and key=" + workspaceKey);

        $.ajax({
            type: "DELETE",
            url: "/mongo_svr/ve/delete_workspace/" + workspaceKey,
            success: function(json)
            {
                workspaces.remove(workspace);
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    // public API
    return {

        /**
         * Refresh all workspaces from server.
         */
        refreshWorkspaces: refreshWorkspaces,

        /**
         * Gets a Workspace model for the corresponding key.
         * @param workspaceKey
         */
        getWorkspace: function(workspaceKey)
        {
            return workspaces.findWhere({key: workspaceKey});
        }
    };

};