// ENUM
var ReadyStatus =
{
    UNKNOWN:    -2,
    FAILED:     -1,
    NOT_READY:  0,
    READY:      1
}

var Workspace = Backbone.Model.extend({
    defaults: function()
    {
        return {
            key:    "NA",
            alias:  "NA",
            user:   "NA",
            status: ReadyStatus.UNKNOWN,
            id:      guid()
        };
    }
});

