var VariantTableColumn = Backbone.Model.extend({
    defaults: function()
    {
        return {
            name:           "NA",
            displayName:    "NA",
            visible:        false,
            description:    "NA",
            id:              guid()
        };
    }
});
