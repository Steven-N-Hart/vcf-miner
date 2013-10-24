// COLLECTION of SampleGroup models
var SampleGroupList = Backbone.Collection.extend({
    model: SampleGroup,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },
    comparator: 'order'
});