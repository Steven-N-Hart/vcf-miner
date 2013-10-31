var VariantTable = function (sampleGroups) {

    // private variables
    var groupList = $('#group_list');
    var view;
    var createGroupDialog = new CreateGroupDialog(sampleGroups);

    // public API
    return {
        /**
         * Resets the state of this tab.
         *
         * @param ws
         *      The workspace key.
         * @param allSampleNames
         *      An array of strings, each string representing a sample name.
         */
        initialize: function(ws, allSampleNames)
        {
            createGroupDialog.initialize(ws, allSampleNames);
        }

    };

};