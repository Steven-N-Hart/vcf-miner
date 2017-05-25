/**
 * Confirmation dialog.
 *
 * @param title
 * @param message
 * @param confirmCallback
 * @returns {{show: Function}}
 * @constructor
 */
var ConfirmDialog = function (title, message, confirmButtonText, confirmCallback, cancelCallback, shownCallback) {

    // private variables

    $('#confirm_modal_ok').click(function()
    {
        confirmCallback();

        close();
    });

    $('#confirm_modal_cancel').click(function()
    {
        if (cancelCallback !== undefined) {
            cancelCallback();
        }

        close();
    });

    function close()
    {
        // unregister event handlers
        $('#confirm_modal_ok').unbind();
        $('#confirm_modal_cancel').unbind();

        $('#confirm_modal').modal('hide');
    }

    // public API
    return {

        /**
         * Shows the dialog
         */
        show: function()
        {
            $('#confirm_label').text(title);
            $('#confirm_modal .modal-body').html(message);
            $('#confirm_modal_ok').text(confirmButtonText);

            $('#confirm_modal').modal();

            $('#confirm_modal').on('shown', function () {
                if (shownCallback != undefined) {
                    shownCallback($('#confirm_modal_ok'), $('#confirm_modal_cancel'));
                }
            })
        }
    };

};