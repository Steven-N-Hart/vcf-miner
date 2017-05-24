var VariantTableColumnList = Backbone.Collection.extend({
    model: VariantTableColumn,
    localStorage: new Backbone.LocalStorage("mongo-backbone"),
    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },
    comparator: 'order',

    /**
     * Gets the columns that are currently visible in this collection.
     *
     * @returns {VariantTableColumnList}
     *      A collection of VariantTableColumn models that are visible in the table.
     */
    getVisibleColumns: function()
    {
        var visibleCols = new VariantTableColumnList();
        _.each(this.models, function(col)
        {
            if (col.get("visible"))
            {
                visibleCols.add(col);
            }
        });
        return visibleCols;
    }

});