var FilterStep = Backbone.Model.extend({
    defaults: function() {

        return {
            id:         guid(),
            filters:    new FilterList(),
            numMatches: null,
            removable:  false
        };

    }
});