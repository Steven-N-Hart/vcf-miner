var GroupFilterTab = function (sampleGroups) {

    // private variables
    var groupList = $('#group_list');
    var count = $('#group_sample_count');
    var list = $('#group_sample_names_list');

    var view;
    var createGroupDialog = new CreateGroupDialog(sampleGroups);

    $('#new_group_button').click(function (e)
    {
        createGroupDialog.show();
    });

    // add custom validation method for the group drowdown to make sure a group
    // is selected
    jQuery.validator.addMethod("checkGroup", function(value, element) {

        if (typeof getSelectedGroup() === 'undefined')
        {
//            if ($("#group_field_value_validation_warning").length == 0)
//                $("#group_value_div").append('<div class="row-fluid" id="group_field_value_validation_warning"><label>A group must be selected.</label></div>');
            return false;
        }
        else
        {
//            $("#group_field_value_validation_warning").remove();
            return true;
        }
    }, "A group must be selected.");

    // jQuery validate plugin config
    $('#group_tab_form').validate(
        {
            rules:
            {
                group_list: {
                    checkGroup: true
                }
            }
        }
    );

    // selection in group list selection has changed or clicked on
    groupList.change(function()
    {
        var group = getSelectedGroup();

        updateGroupInfo(group);
    });

    function updateGroupInfo(group)
    {
        count.empty();
        list.empty();

        if (typeof group !== 'undefined')
        {
            count.append('Number of samples: <b>' + group.get("sampleNames").length) + '</b>';


            var listHTML = '<select size="8">';
            for (var i=0; i < group.get("sampleNames").length; i++)
            {
                listHTML += "<option>" + group.get("sampleNames")[i] + "</option>";
            }
            listHTML += '</select>';
            list.append(listHTML);
        }
    }

    function getSelectedGroup()
    {
        // get selected option from select
        var groupOption = $('#group_list option:selected');

        var id = groupOption.val();

        var group = sampleGroups.findWhere({id: id});

        if (typeof group !== 'undefined')
            console.debug("user selected group with id=" + id + " name=" + group.get("name"));

        return group;
    }

    /**
     * Single option in list.
     * @type {*}
     */
    var OptionView = Backbone.View.extend({

        tagName: "option",

        initialize: function()
        {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function()
        {
            this.$el.text(this.model.get("name"));
            this.$el.attr( 'id', this.model.get("id"));
            this.$el.attr( 'value', this.model.get("id"));

            return this;
        }
    });

    /**
     * Overall view for entire list.  Contains a nested view per list option.
     * @type {*}
     */
    var ListView = Backbone.View.extend({
        el: $("#group_list"),

        initialize: function()
        {
            this.listenTo(sampleGroups, 'add',    this.addOne);
            this.listenTo(sampleGroups, 'remove', this.removeOne);
            this.listenTo(sampleGroups, 'reset',  this.removeAll);
        },

        render: function()
        {
        },

        addOne: function(group)
        {
            var view = new OptionView({model: group});
            this.$el.append(view.render().el);

            // auto-select the added one
            $("#group_list option[value='"+ group.get("id") +"']").prop('selected',true);
            updateGroupInfo(group);
            validate();
        },

        removeOne: function(group)
        {
            // remove element with corresponding group ID from DOM
            this.$("#" + group.get("id")).remove();
            validate();
        },

        removeAll: function()
        {
            this.$el.empty();
            count.empty();
            list.empty();
            validate();
        }
    });

    view = new ListView();

    function validate()
    {
        return groupList.valid();
    }

    // public API
    return {
        /**
         * Resets the state of this tab.
         *
         * @param ws
         *      The workspace key.
         * @param allSampleNames
         *      An array of strings, each string representing a sample name.
         */
        initialize: function(ws, allSampleNames)
        {
            createGroupDialog.initialize(ws, allSampleNames);
        },

        /**
         * Performs validation on the user's current selections/entries.
         */
        validate: validate,

        /**
         * Gets the selected filter.
         *
         * @return Filter model
         */
        getFilter: function()
        {
            var group = getSelectedGroup();

            var filter = new Filter();
            filter.set("category", FilterCategory.GROUP);
            filter.set("name", "Variant Samples");
            filter.set("value", group.get("name"));

            var foo = $('#group_operator_list').val();
            switch($('#group_operator_list').val())
            {
                case 'IN':
                    filter.set("operator", FilterOperator.IN);
                    break;
                case 'NOT_IN':
                    filter.set("operator", FilterOperator.NOT_IN);
                    break;
            }

            return filter;
        }

    };

};