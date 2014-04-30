/**
 *
 * @returns {{initialize: Function, show: Function}}
 * @constructor
 */
var CreateGroupDialog = function () {

    // private variables
    var workspaceKey;
    var allSampleNames;
    var availableSamplesList = $('#available_samples_list');
    var groupSamplesList = $('#group_samples_list');
    var sampleGroups;

    // register for Marionette events
    MongoApp.vent.on(MongoApp.events.WKSP_CHANGE, function (workspace) {
        workspaceKey = workspace.get("key");
        allSampleNames = workspace.get("sampleNames");
        sampleGroups = workspace.get("sampleGroups");
    });

    // jQuery validate plugin config
    $('#create_group_form').validate(
        {
            rules:
            {
                group_name_field:
                {
                    required: true,
                    minlength: 1
                }
            },
            submitHandler: function(form) {
                create();
                $('#create_group_modal').modal('hide')
            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        }
    );

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

        MongoApp.vent.trigger(MongoApp.events.WKSP_GROUP_CREATE, group, MongoApp.workspace);
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
         * Shows the dialog
         */
        show: function()
        {
            reset();
            $('#create_group_modal').modal();
        }
    };

};