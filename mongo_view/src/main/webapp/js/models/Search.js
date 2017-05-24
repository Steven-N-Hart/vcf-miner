var Search = Backbone.Model.extend({
    defaults: function() {

        return {
            key:   null,
            name:  "My Analysis",
            description: "This is the description of My Analysis.",
            timestamp:   null,
            user:   "NA",
            filterSteps: new FilterStepList(),
            preload: false,
            id:     guid(),
            saved: true
        };

    }
});