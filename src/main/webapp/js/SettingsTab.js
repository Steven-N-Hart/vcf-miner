/**
 *
 * @param settings
 *
 * @returns {{initialize: Function, show: Function}}
 * @constructor
 */
var SettingsTab = function (settings, indexController) {

    // private variables
    var workspaceKey;

    // jQuery validate plugin config
    $('#settings_general_form').validate(
        {
            rules:
            {
                max_filtered_variants_field: {
                    required: true,
                    integer: true,
                    min:1
                },
                popover_time_field: {
                    required: true,
                    integer: true,
                    min:0,
                    max:10
                },
                max_filter_values_field: {
                    required: true,
                    integer: true,
                    min:1
                }
            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        }
    );

    new IndexesStatusView(
        {
            "el": $('#indexes_status_div'),
            "model": indexController.getOverallIndexStatus()
        }
    );

    new IndexTableView(
        {
            "el": $('#general_indexes_table_div'),
            "model": indexController.getGeneralIndexes(),
            "sortable":false,
            "createIndexCallback": indexController.createIndex,
            "dropIndexCallback": indexController.deleteIndex
        }
    );
    new IndexTableView(
        {
            "el": $('#info_indexes_table_div'),
            "model": indexController.getInfoIndexes(),
            "sortable":true,
            "createIndexCallback": indexController.createIndex,
            "dropIndexCallback": indexController.deleteIndex
        }
    );
    new IndexTableView(
        {
            "el": $('#format_indexes_table_div'),
            "model": indexController.getFormatIndexes(),
            "createIndexCallback": indexController.createIndex,
            "dropIndexCallback": indexController.deleteIndex
        }
    );

    var fieldMaxFilteredVariants = $('#max_filtered_variants_field');
    settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
    fieldMaxFilteredVariants.change(function(event) {

        if (fieldMaxFilteredVariants.valid() == true){
            settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
        }

    });

    var fieldPopoverTime = $('#popover_time_field');
    settings.popupDuration = fieldPopoverTime.val();
    fieldPopoverTime.change(function(event) {

        if (fieldPopoverTime.valid() == true){
            settings.popupDuration = fieldPopoverTime.val();
        }

    });

    var fieldMaxFilterValues = $('#max_filter_values_field');
    settings.maxFilterValues = fieldMaxFilterValues.val();
    fieldMaxFilterValues.change(function(event) {

        if (fieldMaxFilterValues.valid() == true){
            settings.maxFilterValues = fieldMaxFilterValues.val();
        }

    });

    var fieldShowMissingIdxWarnings = $('#show_missing_index_warnings');
    fieldShowMissingIdxWarnings.change(function(event) {

        var checkbox = event.currentTarget;
        if (checkbox.checked) {
            settings.showMissingIndexWarning = true;
        } else
        {
            settings.showMissingIndexWarning = false;
        }
    });


    // public API
    return {

        initialize: function(wsKey)
        {
            workspaceKey = wsKey;
        }

    };

};