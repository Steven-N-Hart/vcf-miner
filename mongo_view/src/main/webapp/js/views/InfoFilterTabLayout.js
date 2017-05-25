InfoFilterTabLayout = Backbone.Marionette.Layout.extend({

    dataFields: new VCFDataFieldList(),

    workspaceKey: null,

    template: "#info-filter-tab-layout-template",

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
    },

    initWorkspace: function(workspaceKey) {

        var self = this;

        this.workspaceKey = workspaceKey;
        var workspace = MongoApp.workspaceController.getWorkspace(workspaceKey);

        // pick out the GENERAL and INFO data fields
        var infoFieldCount = 0;
        this.dataFields.reset();
        _.each(workspace.get("dataFields").models, function(vcfDataField) {
            if (vcfDataField.get("category") == VCFDataCategory.INFO) {
                infoFieldCount++;
            }

            if ((vcfDataField.get("category") == VCFDataCategory.GENERAL) ||
                (vcfDataField.get("category") == VCFDataCategory.INFO)) {
                self.dataFields.add(vcfDataField);
            }
        });

        // check to see whether we have any INFO annotation
        if (infoFieldCount > 0)
            this.$el.find('#no_info_annotation_warning').toggle(false);
        else
            this.$el.find('#no_info_annotation_warning').toggle(true);

    },

    onShow: function() {

        // jQuery validate plugin config
        var form = this.$el.find('#info_tab_form');
//        form.validate();
        form.validate({
            rules: {
            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        });

        this.initWorkspace(MongoApp.workspaceKey);

        var self = this;

        <!-- sub-view that renders available filterSteps in a dropdown choicebox -->
        var ListView = Backbone.View.extend({

            initialize: function() {
                this.listenTo(this.model, 'add',    this.addOne);
                this.listenTo(this.model, 'remove', this.removeOne);
                this.listenTo(this.model, 'reset',  this.removeAll);

                this.render();
            },

            /**
             * Delegated events
             */
            events: {
                "change" : "selectionChanged"
            },

            render: function(){
                var self = this;
                var infoDataFields = this.model;
                // render current filterSteps in collection
                _.each(infoDataFields.models, function(infoDataField) {
                    self.addOne(infoDataField);
                });
            },

            addOne: function(infoDataField) {
                var fieldID = infoDataField.get("name");
                var desc = infoDataField.get("description");
                this.$el.append("<option value='"+fieldID+"' title='"+desc+"'>"+fieldID+"</option>");
            },

            selectionChanged: function() {
                self.infoFieldChanged();
            },

            removeOne: function(infoDataField) {
                var fieldID = infoDataField.get("name");
                self.$el.find("#info_field_list option[value='"+fieldID+"']").remove();
            },

            removeAll: function() {
                this.$el.empty();
            }
        });

        this.view = new ListView({
            "el": this.$el.find('#info_field_list'),
            "model": this.dataFields
        });

        if (this.dataFields.length > 0) {
            // simulate user choosing the 1st INFO field
            this.infoFieldChanged();
        }
    },

    validate: function() {
        var infoField = this.getSelectedDataField();

        switch (infoField.get("type")) {
            case VCFDataType.STRING:

                if (this.$el.find('#info_str_value_area').length > 0) {
                    if (this.$el.find('#info_str_value_area').val().trim().length > 0) {
                        this.$el.find("#info_field_value_validation_warning").remove();
                        return true;
                    }
                    else {
                        if (this.$el.find("#info_field_value_validation_warning").length == 0)
                            this.$el.find("#info_value_div").append('<div class="row-fluid" id="info_field_value_validation_warning"><div class="alert alert-error">At least 1 value should be entered.</div></div>');
                    }
                }
                else {
                    var numChecked = this.$el.find("#info_field_dropdown_checkbox").dropdownCheckbox("checked").length;
                    if(numChecked > 0) {
                        this.$el.find("#info_field_value_validation_warning").remove();
                        return true;
                    }
                    else {
                        if (this.$el.find("#info_field_value_validation_warning").length == 0)
                            this.$el.find("#info_value_div").append('<div class="row-fluid" id="info_field_value_validation_warning"><div class="alert alert-error">At least 1 string should be checked.</div></div>');

                        return false;
                    }
                }
                break
            default:
                return this.$el.find('#info_tab_form').valid();
        }
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
    },

    /**
     * Gets the currently selected VCFDataField model.
     *
     * @returns {*}
     */
    getSelectedDataField: function() {
        var fieldID = this.$el.find('#info_field_list').val();
        return this.dataFields.findWhere({name: fieldID});
    },

    /**
     * Dynamically alters the tab's "operator" and "value" areas based on
     * the selected INFO field.
     */
    infoFieldChanged: function() {

        // constants for operator options
        var OPTION_EQ   = "<option value='eq'>=</option>";
        var OPTION_GT   = "<option value='gt'>&gt;</option>";
        var OPTION_GTEQ = "<option value='gteq'>&#x2265;</option>";
        var OPTION_LT   = "<option value='lt'>&lt;</option>";
        var OPTION_LTEQ = "<option value='lteq'>&#x2264;</option>";
        var OPTION_NE   = "<option value='ne'>&#x2260;</option>";

        var self = this;

        // get selected VCFDataField model
        var infoField = this.getSelectedDataField();
        var fieldID = infoField.get("name");
        if (infoField.get("category") == VCFDataCategory.INFO) {
            // re-attach the INFO. prefix
            fieldID = "INFO." + fieldID;
        }

        // value DIV area
        var valueDiv = this.$el.find("#info_value_div");
        // clear div value area
        valueDiv.empty();

        // operator list
        var opList = this.$el.find("#info_operator_list");
        // clear operator list
        opList.empty();

        var includeNullsHTML =
            //"<div class='row-fluid checkbox'><label><input type='checkbox' id='include_nulls'> Keep variants with missing annotation (+null)</label></div>";
            "<div class='row-fluid'><input type='checkbox' id='include_nulls'/> Keep variants with missing annotation (+null)</div>";

        switch (infoField.get("type")) {
            case VCFDataType.FLAG:
                opList.append(OPTION_EQ);
                //opList.append(OPTION_NE); // not supported by server-side
                valueDiv.append(
                    "<div id='info_flag_radio_group' class='form-inline'>" +
                        "<label class='radio inline' style='margin-right:20px;'><input type='radio' name='flag_group' id='true' checked='true'> True</label>" +
                        "<label class='radio inline'><input type='radio' name='flag_group' id='false'> False</label>" +
                        "</div>"
                );
                break;
            case VCFDataType.INTEGER:
                opList.append(OPTION_EQ);
                opList.append(OPTION_GT);
                opList.append(OPTION_GTEQ);
                opList.append(OPTION_LT);
                opList.append(OPTION_LTEQ);
                opList.append(OPTION_NE);
                valueDiv.append("<div class='row-fluid' id='value_div'><input name='int_field_value' class='input-mini' value='0'></div>");
                valueDiv.append("<div class='row-fluid'><div class='span12'><hr></div></div>");
                valueDiv.append(includeNullsHTML);

                // since the FORM's <input> was added dynamically, we need to communicate to the
                // jQuery validate plugin by adding a validation rule on the fly
                // @see http://jqueryvalidation.org/rules
                valueDiv.find("input[name='int_field_value']").rules("add", {
                    required:true,
                    integer:true,
                    messages: {
                        integer: 'Please enter a non-decimal number.'
                    }
                });
                break;
            case VCFDataType.FLOAT:
                opList.append(OPTION_EQ);
                opList.append(OPTION_GT);
                opList.append(OPTION_GTEQ);
                opList.append(OPTION_LT);
                opList.append(OPTION_LTEQ);
                opList.append(OPTION_NE);
                valueDiv.append("<div class='row-fluid' id='value_div'><input name='float_field_value' class='input-mini' step='any' value='0.0'></div>");
                valueDiv.append("<div class='row-fluid'><div class='span12'><hr></div></div>");
                valueDiv.append(includeNullsHTML);

                // since the FORM's <input> was added dynamically, we need to communicate to the
                // jQuery validate plugin by adding a validation rule on the fly
                // @see http://jqueryvalidation.org/rules
                valueDiv.find("input[name='float_field_value']").rules("add", {
                    required:true,
                    number:true,
                    messages: {
                        number: 'Please enter a number.'
                    }
                });
                break;
            case VCFDataType.STRING:
                opList.append(OPTION_EQ);
                opList.append(OPTION_NE);

                var maxFilterValues = parseInt(MongoApp.settings.maxFilterValues);
                var values = this.getFieldValues(fieldID, maxFilterValues + 1);

                // use typahead if we have MORE values than specified as the max
                if (values.length > maxFilterValues) {
                    var maxTypeaheadValues = 1000; // TODO: have this max configurable?
                    valueDiv.append('<input id="info_str_typeahead" type="text" placeholder="enter value here" autocomplete="off" spellcheck="false"/>');
                    valueDiv.append('<textarea id="info_str_value_area" rows="7" wrap="off" placeholder="" autocomplete="off" spellcheck="false"/>');
                    $('#info_str_typeahead').typeahead({
                        remote: {
                            url: '/mongo_svr/ve/typeahead/w/'+this.workspaceKey+'/f/'+fieldID+'/p/%QUERY/x/'+maxTypeaheadValues,
                            filter: function(parsedResponse) {
                                var dataset = new Array();
                                var typeaheadValues = parsedResponse[fieldID];
                                for (var i = 0; i < typeaheadValues.length; i++) {
                                    var datum = {
                                        value: typeaheadValues[i]
                                    };
                                    dataset.push(datum);
                                }
                                return dataset;
                            }
                        },
                        limit: maxTypeaheadValues
                    });

                    // restrict the typeahead dropdown's width and height
                    // necessary as there's a chance it will overflow the div and cause weird scrollbar behavior
                    var textarea = $('#info_str_value_area');
                    var dropdownMenu = $('#info_str_typeahead').parent().find('.tt-dropdown-menu');
                    dropdownMenu.css("max-width",  textarea.outerWidth());
                    dropdownMenu.css("max-height", textarea.outerHeight());
                    dropdownMenu.css("overflow", "scroll");

                    // append typeahead value to the textarea
                    this.$el.find('#info_str_typeahead').on('typeahead:selected', function (object, datum) {
                        var area = self.$el.find('#info_str_value_area');
                        area.val(area.val() + datum.value + '\n');

                        // clear out value
                        self.$el.find('#info_str_typeahead').val('');

                        // validate once user adds value
                        self.validate();
                    });

                    // validate after user changes textarea manually
                    this.$el.find('#info_str_value_area').change(function(event) {
                        self.validate();
                    });
                }
                else {
                    // dropdown checkbox widget
                    valueDiv.append("<div class='row-fluid'><div class='dropdown' id='info_field_dropdown_checkbox' name='str_field_value'></div></div>");

                    // sort values
                    values.sort(function(a,b) { return a.localeCompare(b) } );

                    var dropdownData = new Array();
                    for (var i = 0; i < values.length; i++) {
                        dropdownData.push({id: i, label: values[i]});
                    }

                    var dropdownCheckbox = this.$el.find("#info_field_dropdown_checkbox");
                    dropdownCheckbox.dropdownCheckbox({
                        autosearch: true,
                        hideHeader: false,
                        data: dropdownData
                    });

                    // set the max width of the dropdown checkbox widget to be that of the parent DIV container
                    // this will prevent the widget from getting too wide when long string values are present
                    dropdownCheckbox.find('.dropdown-menu').css('max-width', '100%');
                }

                valueDiv.append("<div class='row-fluid'><div class='span12'><hr></div></div>");
                valueDiv.append(includeNullsHTML);
                break;
        }

        // re-validate since form has changed
        this.$el.find('#info_tab_form').valid();
    },

    /**
     * Fetches values for the given field, up to the specified max cutoff.
     * @param fieldID
     *      The field id that values will be retrieved for.
     * @param maxCutoff
     *      The max number of values to return
     * @returns {Array}
     *      An array of string values
     */
    getFieldValues: function(fieldID, maxCutoff) {

        var values = new Array();

        // perform synchronous AJAX call
        $.ajax({
            async: false,
            url: "/mongo_svr/ve/typeahead/w/"+this.workspaceKey+"/f/"+fieldID+"/x/"+maxCutoff,
            dataType: "json",
            success: function(json) {
                values = json[fieldID];
            },
            error: jqueryAJAXErrorHandler
        });

        return values;
    },

    /**
     * Gets a new Filter model built from the user's customizations.
     *
     * @return Filter model
     */
    getFilter: function() {
        // get selected VCFDataField
        var dataField = this.getSelectedDataField();
        var fieldID = dataField.get("name");

        var filter = new Filter();
        filter.set("name", fieldID);
        filter.set("description", dataField.get("description"));

        var isInfo = false;
        if (dataField.get("category") == VCFDataCategory.INFO) {
            isInfo = true;
        }

        switch (dataField.get("type")) {
            case VCFDataType.FLAG:
                filter.set("category", FilterCategory.INFO_FLAG);

                var radioId =  this.$el.find('#info_flag_radio_group input[type=radio]:checked').attr('id');
                if (radioId == 'true') {
                    filter.set("value", true);
                }
                else {
                    filter.set("value", false);
                }
                break;
            case VCFDataType.INTEGER:
                filter.set("category", FilterCategory.INFO_INT);
            case VCFDataType.FLOAT:
                if (isInfo) {
                    filter.set("category", FilterCategory.INFO_FLOAT);
                } else {
                    filter.set("category", FilterCategory.GENERAL_FLOAT);
                }

                filter.set("value", this.$el.find("#info_value_div input").val());
                filter.set("includeNulls", (this.$el.find("#include_nulls:checked").length > 0) ? true:false);
                break;
            case VCFDataType.STRING:
                if (isInfo) {
                    filter.set("category", FilterCategory.INFO_STR);
                } else {
                    filter.set("category", FilterCategory.GENERAL_STRING);
                }

                var valueArr;

                if (this.$el.find('#info_str_value_area').length > 0) {
                    // grab values from text area
                    valueArr = this.$el.find('#info_str_value_area').val().trim().split("\n");
                }
                else {
                    // grab values from dropdown checkbox widget
                    valueArr = new Array();
                    var checkedVals = this.$el.find("#info_field_dropdown_checkbox").dropdownCheckbox("checked");
                    for (var i=0; i < checkedVals.length; i++) {
                        valueArr.push(checkedVals[i].label);
                    }
                }

                filter.set("value", valueArr);
                filter.set("includeNulls", (this.$el.find("#include_nulls:checked").length > 0) ? true:false);
                break;
        };

        // get selected operator
        var operator = FilterOperator.EQ; // default
        var selectedOperatorOpt = this.$el.find('#info_operator_list');
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

        if (MongoApp.settings.showMissingIndexWarning && !MongoApp.indexController.isDataFieldIndexed(dataField)) {
            var confirmDialog = new ConfirmDialog(
                "",
                fieldID + " does not have an index.  Would you like to create a new index to boost filtering performance?",
                "Create Index",
                function() {
                    // confirm
                    MongoApp.indexController.createIndex(MongoApp.indexController.getIndexByDataField(dataField));
                }
            );
            confirmDialog.show();
        }

        return filter;
    }

});