SampleFilterTabLayout = Backbone.Marionette.Layout.extend({

    filters: new FilterList(),

    template: "#sample-filter-tab-layout-template",

    regions: {},

    /**
     * Called when the view is first created
     */
    initialize: function() {

        var self = this;

        // register for Marionette events
        this.stopListening();
        this.listenTo(MongoApp.dispatcher, MongoApp.events.WKSP_CHANGE, function (workspaceKey) {
            self.initWorkspace(workspaceKey);
        });

        // jQuery validate plugin config
        this.$el.find('#sample_tab_form').validate({
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
    },

    initWorkspace: function(workspaceKey) {

        var workspace = MongoApp.workspaceController.getWorkspace(workspaceKey);

        var self = this;

        // remember what the user has selected
        var selectedFilter = this.getSelectedFilter();

        this.filters.reset();

        // translate FORMAT related VCFDataField models into Filter models
        _.each(workspace.get("dataFields").models, function(vcfDataField) {
            if (vcfDataField.get("category") == VCFDataCategory.FORMAT)
            {
                self.filters.add(new Filter(
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
            this.$el.find("#sample_field_list option:contains('"+filterName+"')").prop('selected', true);
        }

        // check to see whether we have any FORMAT annotation
        if (this.filters.length > 0)
            this.$el.find('#no_format_annotation_warning').toggle(false);
        else
            this.$el.find('#no_format_annotation_warning').toggle(true);        
    },
    
    onShow: function() {
        this.initWorkspace(MongoApp.workspaceKey);

        <!-- sub-view that renders available filters in a dropdown choicebox -->
        var ListView = Backbone.View.extend({

            initialize: function() {
                this.listenTo(this.model, 'add',    this.addOne);
                this.listenTo(this.model, 'reset',  this.removeAll);

                this.render();
            },

            render: function(){
                var self = this;
                var filters = this.model;
                // render current filters in collection
                _.each(filters.models, function(filter) {
                    self.addOne(filter);
                });
            },

            addOne: function(filter) {
                var filterID = filter.get("id");
                var filterName = filter.get("name");
                var desc = filter.get("description");
                this.$el.append("<option value='"+filterID+"' title='"+desc+"'>"+filterName+"</option>");
            },

            removeAll: function() {
                this.$el.empty();
            }
        });

        new ListView({
            "el": this.$el.find('#sample_field_list'),
            "model": this.filters
        });
    },

    validate: function() {
        return this.$el.find('#sample_tab_form').valid();
    },

    /**
     * Gets the currently selected VCFDataField model.
     *
     * @returns {*}
     */
    getSelectedFilter: function() {
        var filterID = this.$el.find('#sample_field_list').val();
        return this.filters.findWhere({id: filterID});
    },

    /**
     * Gets the selected filter.
     *
     * @return Filter model
     */
    getFilter: function() {
        // get a cloned instance of the filter and assign new ID
        var filter = this.getSelectedFilter().clone();
        filter.set("id", guid());             // assign new uid

        switch(filter.get("category")) {
            case FilterCategory.FORMAT:
                // get selected operator
                var operator = FilterOperator.EQ; // default
                var selectedOperatorOpt = this.$el.find('#sample_field_op_list');
                if (typeof selectedOperatorOpt !== "undefined") {
                    switch(selectedOperatorOpt.val()) {
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
                var selectedFuncList = this.$el.find('#sample_field_min_max_list');
                if (typeof selectedFuncList !== "undefined") {
                    switch(selectedFuncList.val()) {
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
                filter.set("value", this.$el.find("#sample_value_div input").val());
        }
        return filter;
    }

});