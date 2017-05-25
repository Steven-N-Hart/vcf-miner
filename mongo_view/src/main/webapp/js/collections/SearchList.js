// COLLECTION of Workspace models
var SearchList = Backbone.Collection.extend({
    model: Search,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    comparator: 'alias'
});