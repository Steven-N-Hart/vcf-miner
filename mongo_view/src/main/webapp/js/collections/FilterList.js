// COLLECTION of Filters
var FilterList = Backbone.Collection.extend({
    model: Filter,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },
    comparator: 'timestamp'
});