/**
 *
 * @param settings
 *
 * @returns {{initialize: Function, show: Function}}
 * @constructor
 */
var SettingsTab = function (settings) {

    // private variables
    var indexController = new DatabaseIndexController();
    indexController.refreshIndexes();

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


    var fieldMaxFilteredVariants = $('#max_filtered_variants_field');
    fieldMaxFilteredVariants.change(function(event) {

        if (fieldMaxFilteredVariants.valid() == true){
            settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
        }

    });

    var fieldPopoverTime = $('#popover_time_field');
    fieldPopoverTime.change(function(event) {

        if (fieldPopoverTime.valid() == true){
            settings.popupDuration = fieldPopoverTime.val();
        }

    });

    // public API
    return {

        initialize: function()
        {
        }

    };

};