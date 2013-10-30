var WorkspacesView = function (workspaces) {

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

        template: _.template($('#workspaces-template').html()),

        initialize: function()
        {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function()
        {
            // set id
            $(this.el).attr('id', this.model.get("id"));

            $(this.el).attr('type', 'data_row');

            this.model.set("displayStatus", getDisplayStatus(this.model));

            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    function getDisplayStatus(workspace)
    {
        switch(workspace.get("status"))
        {
            case ReadyStatus.NOT_READY:
                return "Processing";
            case ReadyStatus.READY:
                return "Available";
            case ReadyStatus.FAILED:
                return "Failed";
            default:
                return "NA";
        }
    }

    /**
     * Overall view for entire table.  Contains a nested view per row.
     * @type {*}
     */
    var TableView = Backbone.View.extend({

        el: $("#workspaces_view"),

        initialize: function()
        {
            this.listenTo(workspaces, 'add',    this.addOne);
            this.listenTo(workspaces, 'remove', this.removeOne);
            this.listenTo(workspaces, 'reset',  this.removeAll);
        },

        render: function()
        {
        },

        addOne: function(workspace)
        {
            var view = new RowView({model: workspace});

            // add right before the Add Filter button row
            $("#add_workspace_row").before(view.render().el);
        },

        removeOne: function(workspace)
        {
            // remove element with corresponding group ID from DOM
            $("#" + workspace.get("id")).remove();
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