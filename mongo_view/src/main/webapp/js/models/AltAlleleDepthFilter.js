var AltAlleleDepthFilter = Filter.extend({

    displayName: 'Alternate Allele Depth',

    getNameAsHTML: function() {
        return'<label title="' + this.get("description") + '">' + this.displayName + '</label>';
    },

    getNameAsASCII: function() {
        return this.displayName;
    },

    defaults: function()
    {
        return {
            name: 'AD',
            operator: FilterOperator.GTEQ,
            value: '0',
            category: FilterCategory.ALT_ALLELE_DEPTH,
            description:'Filters variants based on the number of alternate supporting reads',
            valueFunction: FilterValueFunction.MAX,
            numMatches:      0,
            id:              guid(),
            includeNulls:    false,
            removable:       false
        };
    }
});