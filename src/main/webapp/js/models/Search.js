var Search = Backbone.Model.extend({
    defaults: function() {

        return {
            name:  "NA",
            date:   null,
            user:   "NA",
            filters: new FilterList(),
            preload: false,
            id:     guid()
        };

    }
});