// COLLECTION of Workspace models
var WorkspaceList = Backbone.Collection.extend({
    model: Workspace,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },
    comparator: 'order'
});