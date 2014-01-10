// COLLECTION of DatabaseIndex models
var VCFDataFieldList = Backbone.Collection.extend({
    model: VCFDataField,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    comparator: 'todo'
});