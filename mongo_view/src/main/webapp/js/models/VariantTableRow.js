var VariantTableRow = Backbone.Model.extend({
    defaults: function()
    {
        return {
            id:     guid(),
            values: new Array()
        };
    }
});
