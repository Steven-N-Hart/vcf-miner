/**
 * Message dialog.
 *
 * @param title
 * @param message
 * @param callback
 * @returns {{show: Function}}
 * @constructor
 */
MessageDialog = function (title, message) {

    var EVENTS = {
        EVENT_OK: 'event_ok'
    };

    /**
     * Marionette EventAggregator for communicating events.
     */
    var localDispatcher = new Backbone.Wreqr.EventAggregator();


    // private variables

    $('#message_modal_ok').click(function() {

        localDispatcher.trigger(EVENTS.EVENT_OK);

        close();

    });


    function close() {

        // unregister event handlers
        $('#message_modal_ok').unbind();

        $('#message_modal').modal('hide');

    }

    // public API
    return {

        EVENTS: EVENTS,

        localDispatcher: localDispatcher,

        /**
         * Shows the dialog
         */
        show: function() {

            $('#message_label').text(title);
            $('#message_modal .modal-body').html(message);
            $('#message_modal').modal();

        }
    };

};