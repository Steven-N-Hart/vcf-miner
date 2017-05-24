/**
 * View represents a dialog box that allows the user to see available columns and
 * toggle their visibility.
 *
 * @type {*}
 */
var VariantTableConfigColumnsView = Backbone.View.extend({

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     */
    initialize: function(options)
    {
        this.listenTo(this.model, 'add',    this.addOne);
        this.listenTo(this.model, 'remove', this.removeOne);
        this.listenTo(this.model, 'reset',  this.removeAll);
    },

    /**
     * Delegated events
     */
    events:
    {
        "click .toggle-visibility" : "toggleVisibility",
        "click .toggle-all-visibility" : "toggleAllVisibility"
    },

    render: function()
    {
        // start with a clean slate
        this.removeAll();

        // add back on the columns
        for (idx in this.model.models)
        {
            this.addOne(this.model.models[idx]);
        }

        // show dialog box
        $('#columns_modal').modal();
    },

    addOne: function(variantTableCol)
    {
        var template = _.template($('#config-variant-table-col-template').html());
        var html = template(variantTableCol.toJSON());

        // handle setting checkbox state
        if (!variantTableCol.get("visible"))
        {
            // remove attribue checked="true"
            html = html.replace('checked="true"', '');
        }

        this.$el.append(html);
    },

    removeOne: function(variantTableCol)
    {
        // remove TR with corresponding filter ID from DOM
        this.$("#" + filter.get("id")+"_col_row").remove();
    },

    removeAll: function()
    {
        // remove all rows except for the add button row
        this.$("tr[type='data_row']").each(function() {
            $( this ).remove();
        });
    },

    /**
     * Handles a checkbox event and updates the corresponding VariantTableColumn.
     *
     * @param e
     *      The jQuery event.
     */
    toggleVisibility: function(e)
    {
        var checkbox = $(e.currentTarget);

        var colID = checkbox.attr('data-col-id');

        var variantTableCol = this.model.findWhere({id: colID});

        var isVisible = checkbox.is(':checked');
        variantTableCol.set("visible", isVisible);
    },

    /**
     * Handles a "ALL" checkbox events
     *
     * @param e
     *      The jQuery event.
     */
    toggleAllVisibility: function(e)
    {
        var isVisible = $(e.currentTarget).is(':checked');

        // loop through all checkboxes
        this.$(".toggle-visibility").each(function() {
            var infoFieldCheckbox = $(this);

            if (infoFieldCheckbox.is(':checked') !== isVisible)
            {
                infoFieldCheckbox.click();
            }
        });
    }

});