var SampleGroup = Backbone.Model.extend({
    defaults: function()
    {
        return {
            name:        "NA",
            description: "NA",
            sampleNames: [],
            id: guid()
        };
    }
});
