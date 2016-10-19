WorkspaceDropdownView = Backbone.Marionette.ItemView.extend({

    /**
     * Fired when a user selects all groups
     */
    EVENT_ALL_GROUPS: 'all_groups_selected',

    /**
     * Fired when a user selected a single group
     */
    EVENT_ONE_GROUP: 'one_group_selected',

    template: "#workspace-group-dropdown-template",

    events: {
        "change" : "workspaceGroupChanged"
    },

    workspaceGroupChanged: function(e) {
        var selectedValue = $(e.currentTarget).find('option:selected').val();

        if (selectedValue == 'ALL_GROUPS') {
            var userGroups = this.collection;
            this.trigger(this.EVENT_ALL_GROUPS, userGroups);
        } else {
            var userGroup = this.collection.findWhere({id: parseInt(selectedValue)});
            this.trigger(this.EVENT_ONE_GROUP, userGroup);
        }
    },

    disableDropdown: function() {
        this.$el.find('select').prop('disabled', true);
        this.$el.find('img').toggle(true);
        this.$el.find('span').toggle(true);
    },

    enableDropdown: function() {
        this.$el.find('select').prop('disabled', false);
        this.$el.find('img').toggle(false);
        this.$el.find('span').toggle(false);
    }
});