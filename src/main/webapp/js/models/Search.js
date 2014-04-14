var Search = Backbone.Model.extend({
    defaults: function() {

        return {
            key:   null,
            name:  "My Search",
            timestamp:   null,
            user:   "NA",
            filters: new FilterList(),
            preload: false,
            id:     guid()
        };

    }
});