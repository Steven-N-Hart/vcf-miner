/**
 *
 * @param settings
 *
 * @returns {{initialize: Function, show: Function}}
 * @constructor
 */
var SettingsTab = function (settings) {

    // private variables

    // jQuery validate plugin config
    $('#settings_form').validate(
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
            submitHandler: function(form) {
                settings.maxFilteredVariants = $('#max_filtered_variants_field').val();
                settings.popupDuration = $('#popover_time_field').val();
            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        }
    );



    // public API
    return {

    };

};