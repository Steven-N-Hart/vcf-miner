/**
 * Exception for AJAX request errors.
 *
 * @param jqXHR
 *      jQuery XMLHttpRequest object that is a superset of the browser's native XMLHTTPRequest object.
 * @param textStatus
 *      A string describing the type of error that occurred
 * @param errorThrown
 *      An optional exception object.  Possible values for the second argument (besides null) are "timeout", "error",
 *      "abort", and "parsererror". When an HTTP error occurs, errorThrown receives the textual portion of the HTTP
 *      status, such as "Not Found" or "Internal Server Error."
 *
 * @constructor
 */
function AJAXRequestException(jqXHR, textStatus, errorThrown) {
    this.jqXHR = jqXHR;
    this.textStatus = textStatus;
    this.errorThrown = errorThrown;
}

AJAXRequestException.prototype = new Error; // inherit from Error object
