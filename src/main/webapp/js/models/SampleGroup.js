var SampleGroup = Backbone.Model.extend({

    /**
     * Translates a SampleGroup server-side object into a SampleGroup model.
     * @param pojo
     */
    fromPojo: function(pojo) {
        var group = new SampleGroup();

        group.set("name", pojo.alias);
        group.set("description", pojo.description);
        group.set("sampleNames", pojo.samples);

        return group;
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
