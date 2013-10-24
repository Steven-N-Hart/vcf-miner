var ConfigVariantTableView = function (variantTableCols) {

    // private variables
    var view;

    /**
     * Single row in table.
     * @type {*}
     */
    var RowView = Backbone.View.extend({

        tagName: "tr",

        template: _.template($('#config-variant-table-col-template').html()),

        initialize: function()
        {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function()
        {
            // set id of table row <tr>
            $(this.el).attr('id', this.model.get("id"));

            $(this.el).attr('type', 'data_row');

            var html = this.template(this.model.toJSON());

            // handle setting checkbox state
            if (!this.model.get("visible"))
            {
                // remove attribue checked="true"
                html = html.replace('checked="true"', '');
            }

            this.$el.html(html);

            return this;
        },

        clear: function()
        {
            this.model.destroy();
        }
    });

    /**
     * Overall view for entire table.  Contains a nested view per row.
     * @type {*}
     */
    var TableView = Backbone.View.extend({
        el: $("#config_columns_table"),

        initialize: function()
        {
            this.listenTo(variantTableCols, 'add',    this.addOne);
            this.listenTo(variantTableCols, 'remove', this.removeOne);
            this.listenTo(variantTableCols, 'reset',  this.removeAll);
        },

        render: function()
        {
        },

        addOne: function(variantTableCol)
        {
            var rowView = new RowView({model: variantTableCol});

            this.$el.append(rowView.render().el);
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

    // PUBLIC API
    return {
    };

};