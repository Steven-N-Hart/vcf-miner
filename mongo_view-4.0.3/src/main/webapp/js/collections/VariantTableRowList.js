var VariantTableRowList = Backbone.Collection.extend({
    model: VariantTableRow,
    localStorage: new Backbone.LocalStorage("mongo-backbone")
});