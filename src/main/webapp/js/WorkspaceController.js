/**
 *
 * @param fnSetWorkspaceCallback
 *      Function callback that takes a Workspace as a parameter.  This function is called
 *      when the user changes the workspace.
 *
 * @returns {{refreshWorkspaces: Function, getWorkspace: Function}}
 * @constructor
 */
var WorkspaceController = function (fnSetWorkspaceCallback) {

    // private vars
    var workspaces = new WorkspaceList();

    var users = new Array(); // TODO: users hardcoded - need authentication?
    users.push('steve');
    users.push('dan');

    // array of workspace keys that should be updated automatically
    var notReadyKeys = new Array();
    var TIMER_INTERVAL = 10000; // 10 seconds
    setInterval(updateNotReadyWorkspaces, TIMER_INTERVAL);

    $('#import_workspace_button').click(function()
    {
        addWorkspace();
    });

    new WorkspaceTableView(
        {
            "el": $('#workspaces_table_div'),
            "model": workspaces,
            "fnSetWorkspaceCallback": fnSetWorkspaceCallback,
            "fnDeleteWorkspaceCallback": deleteWorkspace
        }
    );

    /**
     * Move workspaces pane from getting_started screen to workspace screen
     */
    function movePane()
    {
        var workspacesPane = $("#workspaces_pane").detach();
        var placeholder = $("#workspaces_placeholder");
        placeholder.append(workspacesPane);
    }

    function updateNotReadyWorkspaces()
    {
        if (notReadyKeys.length == 0)
        {
            return;
        }

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
                            var key = json[attr].key;
                            var ws = workspaces.findWhere({key: key});

                            if($.inArray(key, notReadyKeys) != -1)
                            {
                                console.log("updating status for key " + key);
                                ws.set("status", json[attr].ready);
                                ws.set("date", getDateString(json[attr].timestamp));

                                if ((ws.get("status") == ReadyStatus.READY) ||
                                    (ws.get("status") == ReadyStatus.FAILED))
                                {
                                    // delete key
                                    var index = notReadyKeys.indexOf(key);
                                    if (index > -1) {
                                        notReadyKeys.splice(index, 1);
                                    }
                                    console.log("Removing auto-updates for key "  + key);
                                }
                            }

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
     * Refreshes the Backbone collection of workspaces by querying the server.
     */
    function refreshAllWorkspaces()
    {
        console.log("refreshing all workspaces");

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
                            ws.set("date", getDateString(json[attr].timestamp));

                            workspaces.add(ws);

                            if ((ws.get("status") == ReadyStatus.NOT_READY) && ($.inArray(ws.get("key"), notReadyKeys) == -1))
                            {
                                console.log("Adding auto-updates for key "  + ws.get("key"));
                                notReadyKeys.push(ws.get("key"));
                            }
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
        console.debug("Adding workspace with name=" + name);

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

        // setup HTTP request header key/value pairs
        xhr.setRequestHeader('file-compression', uploadFile.name);

        xhr.onload = function(oEvent)
        {
            if (xhr.status == 200)
            {
                console.log("Uploaded!");

                $("#progress").css('width','100%');

                refreshAllWorkspaces();
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

        var that = this;
        $.ajax({
            type: "DELETE",
            url: "/mongo_svr/ve/delete_workspace/" + workspaceKey,
            success: function(json)
            {
                that.model.remove(workspace);
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    function getDateString(timestamp)
    {
        var dateStr = '';
        if (typeof timestamp !== "undefined")
        {
            dateStr = moment(timestamp).format('MM/DD/YYYY h:mm A'); ;
        }
        return dateStr;
    }


    // public API
    return {

        /**
         * Refresh all workspaces from server.
         */
        refreshWorkspaces: refreshAllWorkspaces,

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