// COLLECTION of Workspace models
var WorkspaceList = Backbone.Collection.extend({
    model: Workspace,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    comparator: 'alias'
});