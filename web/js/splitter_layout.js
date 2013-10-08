/**
 * Created with IntelliJ IDEA.
 * User: duffp
 * Date: 10/7/13
 * Time: 9:19 PM
 * To change this template use File | Settings | File Templates.
 */

var myLayout;

function toggleStateManagement ( skipAlert, mode ) {
    if (!$.layout.plugins.stateManagement) return;

    var options	= myLayout.options.stateManagement
        ,	enabled	= options.enabled // current setting
        ;
    if ($.type( mode ) === "boolean") {
        if (enabled === mode) return; // already correct
        enabled	= options.enabled = mode
    }
    else
        enabled	= options.enabled = !enabled; // toggle option

    if (!enabled) { // if disabling state management...
        myLayout.deleteCookie(); // ...clear cookie so will NOT be found on next refresh
        if (!skipAlert)
            alert( 'This layout will reload as the options specify \nwhen the page is refreshed.' );
    }
    else if (!skipAlert)
        alert( 'This layout will save & restore its last state \nwhen the page is refreshed.' );

};

// set EVERY 'state' here so will undo ALL layout changes
// used by the 'Reset State' button: myLayout.loadState( stateResetSettings )
var stateResetSettings = {
        north__size:		"auto"
    ,	north__initClosed:	false
    ,	north__initHidden:	false
//    ,	south__size:		"auto"
//    ,	south__initClosed:	false
//    ,	south__initHidden:	false
    ,	west__size:			300
    ,	west__initClosed:	false
    ,	west__initHidden:	false
//    ,	east__size:			300
//    ,	east__initClosed:	false
//    ,	east__initHidden:	false
};

$(document).ready(function ()
{
    myLayout = $('#jquery-ui-container').layout({
       //	reference only - these options are NOT required because 'true' is the default
        closable:					true	// pane can open & close
        ,	resizable:					true	// when open, pane can be resized
        ,	slidable:					true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
        ,	livePaneResizing:			true

        ,	buttonClass:			"button"	// default = 'ui-layout-button'
        ,	togglerClass:			"toggler"	// default = 'ui-layout-toggler'
        ,	togglerLength_open:		35			// WIDTH of toggler on north/south edges - HEIGHT on east/west edges
        ,	togglerLength_closed:	35			// "100%" OR -1 = full height

        //	some resizing/toggling settings
        ,	north__size:			    50	    // OVERRIDE size of header height
        ,	north__resizable:			false	    // OVERRIDE
        ,	north__closable:			false	    // OVERRIDE
        ,	north__slidable:			false	// OVERRIDE the pane-default of 'slidable=true'
        ,	north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
//        ,	south__resizable:			false	// OVERRIDE the pane-default of 'resizable=true'
//        ,	south__spacing_open:		0		// no resizer-bar when open (zero height)
//        ,	south__spacing_closed:		20		// big resizer-bar when open (zero height)

        //	some pane-size settings
        ,	west__minSize:				200
        ,	west__size: 				400
        ,	west__spacing_closed:		21			// wider space when closed
        ,	west__togglerLength_closed:	21			// make toggler 'square' - 21x21
        ,	west__togglerAlign_closed:	"top"		// align to top of resizer
        ,	west__togglerLength_open:	0			// NONE - using custom togglers INSIDE west-pane
        ,	west__togglerTip_open:		"Close West Pane"
        ,	west__togglerTip_closed:	"Open West Pane"
        ,	west__resizerTip_open:		"Resize West Pane"
        ,	west__slideTrigger_open:	"click" 	// default
        ,	west__slideTrigger_close:	"click" 	// default
        ,	west__initClosed:			false
//        ,	west__fxSettings_open:		{ easing: "easeOutBounce" } //	add 'bounce' option to default 'slide' effect

//        ,	east__size:					300
//        ,	east__minSize:				200
//        ,	east__maxSize:				.5 // 50% of layout width
        ,	center__minWidth:			100

        //	some pane animation settings
        ,	west__animatePaneSizing:	false
        ,	west__fxSpeed_size:			"fast"	// 'fast' animation when resizing west-pane
        ,	west__fxSpeed_open:			1000	// 1-second animation when opening west-pane
        ,	west__fxSettings_open:		{ easing: "easeOutQuint" }
        ,	west__fxSettings_close:		{ easing: "easeInQuint" }

        //	enable showOverflow on west-pane so CSS popups will overlap north pane
        ,	west__showOverflowOnHover:	true

        //	enable state management
        ,	stateManagement__enabled:	true // automatic cookie load & save enabled by default

        ,	showDebugMessages:			true // log and/or display messages from debugging & testing code
    });

    // if there is no state-cookie, then DISABLE state management initially
    var cookieExists = !$.isEmptyObject( myLayout.readCookie() );
    if (!cookieExists) toggleStateManagement( true, false );

    // 'Reset State' button requires updated functionality in rc29.15+
    if ($.layout.revision && $.layout.revision >= 0.032915)
        $('#btnReset').show();

    /*******************************
     ***  CUSTOM LAYOUT BUTTONS  ***
     *******************************
     *
     * Add SPANs to the east/west panes for customer "close" and "pin" buttons
     *
     * COULD have hard-coded span, div, button, image, or any element to use as a 'button'...
     * ... but instead am adding SPANs via script - THEN attaching the layout-events to them
     *
     * CSS will size and position the spans, as well as set the background-images
     */
    var westSelector = "body > .ui-layout-west"; // outer-west pane
    // CREATE SPANs for close-buttons - using unique IDs as identifiers
    $("<span></span>").attr("id", "west-closer" ).prependTo( westSelector );
    // BIND layout events to close-buttons to make them functional
    myLayout.addCloseBtn("#west-closer", "west");

});
