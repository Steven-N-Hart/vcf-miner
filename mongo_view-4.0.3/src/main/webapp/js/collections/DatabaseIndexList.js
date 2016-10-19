// COLLECTION of DatabaseIndex models
var DatabaseIndexList = Backbone.Collection.extend({
    model: DatabaseIndex,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    comparator: 'todo'
});