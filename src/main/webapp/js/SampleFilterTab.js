/**
 *
 * @param groups
 * @returns {{initialize: Function, validate: Function, getFilter: Function}}
 * @constructor
 */
var SampleFilterTab = function (groups) {

    // private variables
    var filters = new FilterList();

    // constants
    var FILTER_IN_GROUP        = new Filter({name: 'Samples in Group',     operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.IN_GROUP, description:'Filters variants based on matching samples'});
    var FILTER_NOT_IN_GROUP    = new Filter({name: 'Samples not in Group', operator: FilterOperator.EQ, value: '0', displayValue: '0', category: FilterCategory.NOT_IN_GROUP, description:'Filters variants based on non-matching samples'});

    var count = $('#group_sample_count');
    var list = $('#group_sample_names_list');

    var createGroupDialog = new CreateGroupDialog(groups);
    $('#new_group_button').click(function (e)
    {
        createGroupDialog.show();
    });

    // popover for the dropdown
    $('#sample_field_list').popover(
        {
            placement: 'bottom',
            trigger: 'hover',
            html: true,
            content: function() {
                return getSelectedFilter().get("description");
            },
            delay: {show: 1000}
        }
    );

    var groupListView = new GroupListView(
        {
            "el": $('#group_list'),
            "model": groups,
            "fnGroupChangeCallback": groupChanged
        }
    );

    // add custom validation method for the group drowdown to make sure a group
    // is selected
    jQuery.validator.addMethod("checkGroup", function(value, element) {

        if (typeof groupListView.getSelectedGroup() === 'undefined')
        {
            return false;
        }
        else
        {
            return true;
        }
    }, "A group must be selected.");

    // jQuery validate plugin config
    $('#sample_tab_form').validate({
            rules: {
                sample_filter_value: {
                    required: true,
                    number:true
                },

                group_list: {
                    checkGroup: true
                }

            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        }
    );

    var ListView = Backbone.View.extend({

        initialize: function()
        {
            this.listenTo(this.model, 'add',    this.addOne);
            this.listenTo(this.model, 'reset',  this.removeAll);
        },

        /**
         * Delegated events
         */
        events:
        {
            "change" : "selectionChanged"
        },

        render: function()
        {
        },

        addOne: function(filter)
        {
            var filterID = filter.get("id");
            var filterName = filter.get("name")
            this.$el.append("<option value='"+filterID+"'>"+filterName+"</option>");
        },

        selectionChanged: function(e)
        {
            sampleFieldChanged();
        },

        removeAll: function()
        {
            this.$el.empty();
        }
    });

    view = new ListView(
        {
            "el": $('#sample_field_list'),
            "model": filters
        }
    );

    function sampleFieldChanged()
    {
        // get rid of popover if it's currently shown
        $('#sample_field_list').popover('hide');

        // get selected filter
        var filter = getSelectedFilter();

        switch(filter.get("category"))
        {
            case FilterCategory.IN_GROUP:
            case FilterCategory.NOT_IN_GROUP:
                // always make sure count and sample list
                // are cleared if no group is selected
                if (typeof groupListView.getSelectedGroup() == 'undefined')
                {
                    count.empty();
                    list.empty();
                }

                // make sure a group is selected, otherwise it should show a
                // validation warning to user
                validate();

                $('#group_value_div').toggle(true);
                $('#sample_value_div').toggle(false);
                $('#sample_field_op_list').toggle(false);
                $('#sample_field_min_max_list').toggle(false);
            break;

            case FilterCategory.FORMAT:
                // all other cases
                $('#group_value_div').toggle(false);
                $('#sample_value_div').toggle(true);
                $('#sample_field_op_list').toggle(true);
                $('#sample_field_min_max_list').toggle(true);
                break;
        }
    }

    /**
     * Called when the selected group changes.
     *
     * @param group
     */
    function groupChanged(group)
    {
        count.empty();
        list.empty();

        count.append('Number of samples: <b>' + group.get("sampleNames").length + '</b>');

        var listHTML = '<select size="8">';
        for (var i=0; i < group.get("sampleNames").length; i++)
        {
            listHTML += "<option>" + group.get("sampleNames")[i] + "</option>";
        }
        listHTML += '</select>';
        list.append(listHTML);

        validate();
    }

    function validate()
    {
        return $('#sample_tab_form').valid();
    }

    /**
     * Gets the currently selected VCFDataField model.
     *
     * @returns {*}
     */
    function getSelectedFilter()
    {
        var filterID = $('#sample_field_list').val();
        return filters.findWhere({id: filterID});
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
        initialize: function(ws, allSampleNames, vcfDataFields)
        {
            createGroupDialog.initialize(ws, allSampleNames);

            filters.reset();

            // translate FORMAT related VCFDataField models into Filter models
            _.each(vcfDataFields.models, function(vcfDataField) {
                if (vcfDataField.get("category") == VCFDataCategory.FORMAT)
                {
                    filters.add(new Filter(
                        {
                            name: vcfDataField.get("id"),
                            description: vcfDataField.get("description"),
                            operator: FilterOperator.EQ,
                            value: '0',
                            displayValue: '0',
                            category: FilterCategory.FORMAT,
                            valueFunction: FilterValueFunction.MAX
                        }
                    ));
                }
            });

            // standard group filters added last
            filters.add(FILTER_IN_GROUP);
            filters.add(FILTER_NOT_IN_GROUP);

            // simulate user choosing the 1st field
            sampleFieldChanged();
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
            // get a cloned instance of the filter and assign new ID
            var filter = getSelectedFilter().clone();
            filter.set("id", guid());             // assign new uid

            switch(filter.get("category"))
            {
                case FilterCategory.IN_GROUP:
                case FilterCategory.NOT_IN_GROUP:
                    filter.set("value", groupListView.getSelectedGroup().get("name"));
                    break;

                case FilterCategory.FORMAT:
                    // get selected operator
                    var operator = FilterOperator.EQ; // default
                    var selectedOperatorOpt = $('#sample_field_op_list');
                    if (typeof selectedOperatorOpt !== "undefined")
                    {
                        switch(selectedOperatorOpt.val())
                        {
                            case 'eq':
                                operator = FilterOperator.EQ;
                                break;
                            case 'gt':
                                operator = FilterOperator.GT;
                                break;
                            case 'gteq':
                                operator = FilterOperator.GTEQ;
                                break;
                            case 'lt':
                                operator = FilterOperator.LT;
                                break;
                            case 'lteq':
                                operator = FilterOperator.LTEQ;
                                break;
                            case 'ne':
                                operator = FilterOperator.NE;
                                break;
                        }
                    }
                    filter.set("operator", operator);

                    // get value function
                    var valueFunc;
                    var selectedFuncList = $('#sample_field_min_max_list');
                    if (typeof selectedFuncList !== "undefined")
                    {
                        switch(selectedFuncList.val())
                        {
                            case 'min':
                                valueFunc = FilterValueFunction.MIN;
                                break;
                            case 'max':
                                valueFunc = FilterValueFunction.MAX;
                                break;
                            default:
                                valueFunc = FilterValueFunction.NONE;
                        }
                    }
                    filter.set("valueFunction", valueFunc);

                    // all other cases
                    // update filter's value based on textfield value
                    filter.set("value", $("#sample_value_div input").val());
            }
            return filter;
        }

    };

};