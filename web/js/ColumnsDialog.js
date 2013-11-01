var ColumnsDialog = function (variantTable) {

    // private variables
    var view;

    /**
     * Overall view for entire table.  Contains a nested view per row.
     * @type {*}
     */
    var TableView = Backbone.View.extend({

        el: $("#config_columns_table"),

        initialize: function()
        {
            var variantTableCols = variantTable.getAllColumns();
            this.listenTo(variantTableCols, 'add',    this.addOne);
            this.listenTo(variantTableCols, 'remove', this.removeOne);
            this.listenTo(variantTableCols, 'reset',  this.removeAll);
        },

        render: function()
        {
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

            // register event listener on checkbox
            $('#' + variantTableCol.get("id") + '_visible_checkbox').click(function (e)
            {
                var isVisible = $(this).is(':checked');
                variantTableCol.set("visible", isVisible);
            });
        },

        removeOne: function(variantTableCol)
        {
            // remove TR with corresponding filter ID from DOM
            this.$("#" + filter.get("id")).remove();
        },

        removeAll: function()
        {
            // remove all rows except for the add button row
            this.$("tr[type='data_row']").each(function() {
                $( this ).remove();
            });
        }
    });

    view = new TableView();

    // public API
    return {
        /**
         * Shows the dialog
         */
        show: function()
        {
            $('#columns_modal').modal();
        }
    };

};