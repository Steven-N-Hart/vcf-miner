var SampleGroup = Backbone.Model.extend({

    toSampleGroupPOJO: function(workspaceKey)
    {
        var pojo = {};
        pojo.workspace   = workspaceKey;
        pojo.alias       = this.get("name");
        pojo.description = this.get("description");
        pojo.samples     = this.get("sampleNames");
        pojo.inSample    = true; // TODO: pull this from UI
        return pojo;
    },

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
