/**
 *
 * @param filters
 * @returns {{setWorkspace: Function, setDisplayCols: Function}}
 * @constructor
 */
var SearchFilterView = function (filters) {

    // private variables
    var workspaceKey;
    var displayCols;
    var view;

    /**
     * Single row in table.
     * @type {*}
     */
    var RowView = Backbone.View.extend({

        tagName: "tr",

        template: _.template($('#searched-filter-template').html()),

        initialize: function()
        {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function()
        {
            // set id
            $(this.el).attr('id', this.model.get("id"));

            $(this.el).attr('type', 'data_row');

            this.$el.html(this.template(this.model.toJSON()));

            setRemoveFilterButtonVisibility();

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
        el: $("#searched_view"),

        initialize: function()
        {
            this.listenTo(filters, 'add',    this.addOne);
            this.listenTo(filters, 'remove', this.removeOne);
            this.listenTo(filters, 'reset',  this.removeAll);
        },

        render: function()
        {
        },

        addOne: function(filter)
        {
            // send query request to server
            var query = buildQuery(filters, workspaceKey);
            sendQuery(query, displayCols);

            var rowView = new RowView({model: filter});

            // add right before the Add Filter button row
            this.$("#add_filter_row").before(rowView.render().el);
        },

        removeOne: function(filter)
        {
            // send query request to server
            var query = buildQuery(filters, workspaceKey);
            sendQuery(query, displayCols);

            // remove TR with corresponding filter ID from DOM
            this.$("#" + filter.get("id")).remove();

            setRemoveFilterButtonVisibility();
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

    /**
     *
     */
    function setRemoveFilterButtonVisibility()
    {
        var lastFilter = _.last(filters.models);

        // loop through filter collection
        // remove button should ONLY be visible if it's
        // 1.) not the NONE filter
        // 2.) is the last filter in the list
        _.each(filters.models, function(filter)
        {
            var button =  $("#" + filter.get("id") + "_remove_button");
            if ((filter.get("id") != FILTER_NONE.get("id")) &&
                (filter.get("id") == lastFilter.get("id")))
            {
                button.toggle(true);
            }
            else
            {
                button.toggle(false);
            }
        });
    };

    return {
        /**
         *
         * @param workspaceKey
         */
        setWorkspace: function(ws)
        {
            workspaceKey = ws;
        },

        /**
         *
         * @param displayCols
         */
        setDisplayCols: function(cols)
        {
            displayCols = cols;
        }
    };

};