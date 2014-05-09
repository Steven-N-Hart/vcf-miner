/**
 *
 * @param groups
 * @returns {{initialize: Function, validate: Function, getFilter: Function}}
 * @constructor
 */
var SampleFilterTab = function () {

    // private variables
    var filters = new FilterList();

    // register for Marionette events
    MongoApp.vent.on(MongoApp.events.WKSP_CHANGE, function (workspace) {

        // remember what the user has selected
        var selectedFilter = getSelectedFilter();

        filters.reset();

        // translate FORMAT related VCFDataField models into Filter models
        _.each(workspace.get("dataFields").models, function(vcfDataField) {
            if (vcfDataField.get("category") == VCFDataCategory.FORMAT)
            {
                filters.add(new Filter(
                    {
                        name: vcfDataField.get("name"),
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

        // reselect
        if (selectedFilter != undefined) {
            var filterName = selectedFilter.get("name");
            $("#sample_field_list option:contains('"+filterName+"')").prop('selected', true);
        }

        // check to see whether we have any INFO annotation
        if (filters.length > 0)
            $('#no_format_annotation_warning').toggle(false);
        else
            $('#no_format_annotation_warning').toggle(true);
    });

    // jQuery validate plugin config
    $('#sample_tab_form').validate({
            rules: {
                sample_filter_value: {
                    required: true,
                    number:true
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
            var filterName = filter.get("name");
            var desc = filter.get("description");
            this.$el.append("<option value='"+filterID+"' title='"+desc+"'>"+filterName+"</option>");
        },

        selectionChanged: function(e)
        {
            // no op
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
         */
        initialize: function()
        {
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