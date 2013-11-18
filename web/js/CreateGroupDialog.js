/**
 *
 * @param sampleGroups
 * @returns {{initialize: Function, show: Function}}
 * @constructor
 */
var CreateGroupDialog = function (sampleGroups) {

    // private variables
    var workspaceKey;
    var allSampleNames;
    var availableSamplesList = $('#available_samples_list');
    var groupSamplesList = $('#group_samples_list');

    $('#new_group_apply').click(function()
    {
        create();
    });

    $('#add_sample_to_group_button').click(function (e)
    {
        $('#available_samples_list option:selected').each(function()
        {
            var sampleName = $(this).val();
            groupSamplesList.append("<option>" + sampleName + "</option>");

            // remove option from available list
            $(this).remove();
        });
    });

    $('#remove_sample_from_group_button').click(function (e)
    {
        $('#group_samples_list option:selected').each(function()
        {
            var sampleName = $(this).val();
            availableSamplesList.append("<option value='"+sampleName+"'>" + sampleName + "</option>");

            // remove option from available list
            $(this).remove();
        });
    });

    /**
     * Create a new group
     */
    function create()
    {
        var group = new SampleGroup();
        group.set("name", $('#group_name_field').val());
        group.set("description", '');

        var sampleNames = $.map($('#group_samples_list').find('option'), function(e) { return e.value; });
        group.set("sampleNames", sampleNames);

        sampleGroups.add(group);
        saveSampleGroup(group);
    }

    function saveSampleGroup(group)
    {
        // translate backbone model to pojo expected by server
        var pojo = group.toSampleGroupPOJO(workspaceKey);

        console.debug("Saving group: " + JSON.stringify(pojo));

        //noinspection JSUnusedLocalSymbols
        $.ajax({
            type: "POST",
            url: "/mongo_svr/ve/samples/savegroup",
            contentType: "application/json",
            data: JSON.stringify(pojo),
            dataType: "json",
            success: function(json)
            {
                console.debug("saved group: " + pojo.alias);
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    function reset()
    {
        // reset widgets
        $('#group_name_field').val('');
        availableSamplesList.empty();
        groupSamplesList.empty();

        for (var i=0; i < allSampleNames.length; i++)
        {
            var sampleName = allSampleNames[i];
            availableSamplesList.append("<option value='"+sampleName+"'>" + sampleName + "</option>");
        }
    }

    // public API
    return {
        /**
         * Resets the state of the dialog.
         *
         * @param ws
         *      The workspace key.
         * @param sampleNames
         *      An array of strings, each string representing a sample name.
         */
        initialize: function(ws, sampleNames)
        {
            workspaceKey = ws;
            allSampleNames = sampleNames;
        },

        /**
         * Shows the dialog
         */
        show: function()
        {
            reset();
            $('#create_group_modal').modal();
        }
    };

};