/**
 *
 * @type {*}
 */
var GroupListView = Backbone.View.extend({

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     * custom option: fnSetWorkspaceCallback
     *      Function callback that takes a Workspace as a parameter.  This function is called
     *      when the user changes the workspace.     */
    initialize: function(options)
    {
        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, "add",        this.addOne);
        this.listenTo(this.model, 'remove',     this.removeOne);
        this.listenTo(this.model, "reset",      this.removeAll);

        this.render();
    },

    /**
     * Delegated events
     */
    events:
    {
        "change" : "groupChanged"
    },

    render: function()
    {
        var that = this;
        _.each(this.model.models, function(group)
            {
                that.addOne(group);
            }
        );
    },

    /**
     * Adds one item to the list.
     *
     * @param group
     */
    addOne: function(group)
    {
        var option = this.toOption(group);
        this.$el.append(option);

        // auto-select the added one by triggering a change event
        this.$el.val(option.val()).change();
    },

    /**
     * Removes one item from the list.
     *
     * @param group
     */
    removeOne: function(group)
    {
        // remove element with corresponding group ID from DOM
        this.$("#" + group.get("id")).remove();
    },

    removeAll: function()
    {
        this.$el.empty();
    },

    /**
     * Gets the currently selected group in the dropdown.
     *
     * @returns {*}
     */
    getSelectedGroup: function()
    {
        // get selected option from select
        var groupOption = this.$('option:selected');

        var id = groupOption.attr('id');

        var group = this.model.findWhere({id: id});

        return group;
    },

    /**
     * Translates a group into an HTML option element.
     *
     * @param group
     * @returns {*|jQuery|HTMLElement}
     */
    toOption: function(group)
    {
        var option = $('<option/>');
        option.text(group.get("name"));
        option.attr('id', group.get("id"));
        option.attr('value', this.model.get("id"));
        return option;
    },

    /**
     * Triggered when the select element is changed to a different option.
     *
     * @param event
     */
    groupChanged: function(event)
    {
        var group = this.getSelectedGroup();
        if (typeof group !== 'undefined')
        {
            this.options.fnGroupChangeCallback(group);
        }
    }
});