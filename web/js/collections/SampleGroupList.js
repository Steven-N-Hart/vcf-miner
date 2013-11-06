// COLLECTION of SampleGroup models
var SampleGroupList = Backbone.Collection.extend({
    model: SampleGroup,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    comparator: 'name'
});