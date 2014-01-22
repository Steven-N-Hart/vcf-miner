var InfoFilterTab = function (indexController) {

    // private variables
    var workspaceKey;
    var view;
    var infoFields = new VCFDataFieldList();

    // constants for operator options
    var OPTION_EQ   = "<option value='eq'>=</option>";
    var OPTION_GT   = "<option value='gt'>&gt;</option>";
    var OPTION_GTEQ = "<option value='gteq'>&#x2265;</option>";
    var OPTION_LT   = "<option value='lt'>&lt;</option>";
    var OPTION_LTEQ = "<option value='lteq'>&#x2264;</option>";
    var OPTION_NE   = "<option value='ne'>&#x2260;</option>";

    // TODO: this supposed to be here?
    // initialize the file input field
    $(":file").filestyle({buttonText: ''});

    // jQuery validate plugin config
    $('#info_tab_form').validate(
        {
            rules:
            {
                int_field_value: {
                    required: true,
                    integer: true
                },
                float_field_value: {
                    required: true,
                    number: true
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

    // popover for the info dropdown
    $('#info_field_list').popover(
        {
            placement: 'bottom',
            trigger: 'hover',
            html: true,
            content: function() {
                return getSelectedInfoField().get("description");
            },
            delay: {show: 1000}
        }
    );

    var ListView = Backbone.View.extend({

        initialize: function()
        {
            this.listenTo(this.model, 'add',    this.addOne);
            this.listenTo(this.model, 'remove', this.removeOne);
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

        addOne: function(infoDataField)
        {
            var fieldID = infoDataField.get("id");
            this.$el.append("<option value='"+fieldID+"'>"+fieldID+"</option>");
        },

        selectionChanged: function(e)
        {
            infoFieldChanged();
        },

        removeOne: function(infoDataField)
        {
            var fieldID = infoDataField.get("id");
            $("#info_field_list option[value='"+fieldID+"']").remove();
        },

        removeAll: function()
        {
            this.$el.empty();
        }
    });

    view = new ListView(
        {
            "el": $('#info_field_list'),
            "model": infoFields
        }
    );

    /**
     * Gets the currently selected VCFDataField model.
     *
     * @returns {*}
     */
    function getSelectedInfoField()
    {
        var fieldID = $('#info_field_list').val();
        return infoFields.findWhere({id: fieldID});
    }

    /**
     * Dynamically alters the tab's "operator" and "value" areas based on
     * the selected INFO field.
     */
    function infoFieldChanged()
    {
        // get rid of popover if it's currently shown
        $('#info_field_list').popover('hide');

        // get selected VCFDataField model
        var infoField = getSelectedInfoField();
        var fieldID = infoField.get("id");

        if (SETTINGS.showMissingIndexWarning && !indexController.isDataFieldIndexed(infoField))
        {
            var confirmDialog = new ConfirmDialog(
                "",
                fieldID + " does not have an index.  Would you like to create a new index to boost filtering performance?",
                "Create Index",
                function()
                {
                    // confirm
                    indexController.createIndex(infoField);
                }
            );
            confirmDialog.show();
        }

        // value DIV area
        var valueDiv = $("#info_value_div");
        // clear div value area
        valueDiv.empty();

        // operator list
        var opList = $("#info_operator_list");
        // clear operator list
        opList.empty();

        var includeNullsHTML =
            //"<div class='row-fluid checkbox'><label><input type='checkbox' id='include_nulls'> Keep variants with missing annotation (+null)</label></div>";
        "<div class='row-fluid'><input type='checkbox' id='include_nulls'/> Keep variants with missing annotation (+null)</div>";

        switch (infoField.get("type"))
        {
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
                break;
            case VCFDataType.STRING:
                opList.append(OPTION_EQ);
                opList.append(OPTION_NE);

                var values = getFieldValues(fieldID, SETTINGS.maxFilterValues + 1);

                // use typahead if we have MORE values than specified as the max
                if (values.length > SETTINGS.maxFilterValues)
                {
                    valueDiv.append('<input id="info_str_typeahead" type="text" placeholder="enter value here" autocomplete="off" spellcheck="false"/>');
                    valueDiv.append('<textarea id="info_str_value_area" rows="7" wrap="off" placeholder="" autocomplete="off" spellcheck="false"/>');
                    $('#info_str_typeahead').typeahead({
                        remote:
                        {
                            url: '/mongo_svr/ve/typeahead/w/'+workspaceKey+'/f/'+fieldID+'/p/%QUERY/x/100', //TODO: 100 max?
                            filter: function(parsedResponse) {
                                var dataset = new Array();
                                var values = parsedResponse[fieldID];
                                for (var i = 0; i < values.length; i++) {
                                    var datum = {
                                        value: values[i]
                                    };
                                    dataset.push(datum);
                                }
                                return dataset;
                            }
                        },
                        limit: 10 // TODO: have this max configurable?
                    });

                    // append typeahead value to the textarea
                    $('#info_str_typeahead').on('typeahead:selected', function (object, datum) {
                        var area = $('#info_str_value_area');
                        area.val(area.val() + datum.value + '\n');

                        // clear out value
                        $('#info_str_typeahead').val('');

                        // validate once user adds value
                        validate();
                    });

                    // validate after user changes textarea manually
                    $('#info_str_value_area').change(function(event) {
                        validate();
                    });
                }
                else
                {
                    // dropdown checkbox widget
                    valueDiv.append("<div class='row-fluid'><div class='dropdown' id='info_field_dropdown_checkbox' name='str_field_value'></div></div>");

                    // sort values
                    values.sort(function(a,b) { return a.localeCompare(b) } );

                    var dropdownData = new Array();
                    for (var i = 0; i < values.length; i++)
                    {
                        dropdownData.push({id: i, label: values[i]});
                    }

                    var dropdownCheckbox = $("#info_field_dropdown_checkbox");
                    dropdownCheckbox.dropdownCheckbox({
                        autosearch: true,
                        hideHeader: false,
                        data: dropdownData
                    });
                }

                valueDiv.append("<div class='row-fluid'><div class='span12'><hr></div></div>");
                valueDiv.append(includeNullsHTML);
                break;
        }

        // re-validate since form has changed
        $('#info_tab_form').valid();
    }

    function validate()
    {
        var infoField = getSelectedInfoField();
        var fieldID = infoField.get("id");

        switch (infoField.get("type"))
        {
            case VCFDataType.STRING:

                if ($('#info_str_value_area').length > 0)
                {
                    if ($('#info_str_value_area').val().trim().length > 0)
                    {
                        $("#info_field_value_validation_warning").remove();
                        return true;
                    }
                    else
                    {
                        if ($("#info_field_value_validation_warning").length == 0)
                            $("#info_value_div").append('<div class="row-fluid" id="info_field_value_validation_warning"><div class="alert alert-error">At least 1 value should be entered.</div></div>');
                    }
                }
                else
                {
                    var numChecked = $("#info_field_dropdown_checkbox").dropdownCheckbox("checked").length;
                    if(numChecked > 0)
                    {
                        $("#info_field_value_validation_warning").remove();
                        return true;
                    }
                    else
                    {
                        if ($("#info_field_value_validation_warning").length == 0)
                            $("#info_value_div").append('<div class="row-fluid" id="info_field_value_validation_warning"><div class="alert alert-error">At least 1 string should be checked.</div></div>');

                        return false;
                    }
                }
                break
            default:
                return $('#info_tab_form').valid();
        }
    }

    /**
     * Fetches values for the given field, up to the specified max cutoff.
     * @param fieldID
     * @param max
     * @returns {Array}
     */
    function getFieldValues(fieldID, maxCutoff)
    {
        var values = new Array();
        // perform synchronous AJAX call
        $.ajax({
            async: false,
            url: "/mongo_svr/ve/typeahead/w/"+workspaceKey+"/f/INFO."+fieldID+"/x/"+maxCutoff,
            dataType: "json",
            success: function(json)
            {
                values = json["INFO."+fieldID];
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
        return values;
    }

    /**
     * Determines whether the given field should use the typeahead widget (e.g. lots of values)
     *
     * @param field
     * @returns {boolean}
     */
    function useTypeAheadWidget(fieldID)
    {
        var maxValues = SETTINGS.maxFilterValues;

        var useTypeAhead = false;
        // perform synchronous AJAX call
        $.ajax({
            async: false,
            url: "/mongo_svr/ve/typeahead/w/"+workspaceKey+"/f/INFO."+fieldID,
            dataType: "json",
            success: function(json)
            {
                var valueArray = json[fieldID];
                if ((valueArray == undefined) || (valueArray.length > maxValues))
                {
                    useTypeAhead = true;
                }
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });

        return useTypeAhead;
    }

    // public API
    return {
        /**
         *
         * @param workspaceKey
         */
        initialize: function(ws, vcfDataFields)
        {
            workspaceKey = ws;

            // pick out the INFO data fields
            infoFields.reset();
            _.each(vcfDataFields.models, function(vcfDataField) {
                if (vcfDataField.get("category") == VCFDataCategory.INFO)
                {
                    infoFields.add(vcfDataField);
                }
            });

            // check to see whether we have any INFO annotation
            if (infoFields.length > 0)
                $('#no_info_annotation_warning').toggle(false);
            else
                $('#no_info_annotation_warning').toggle(true);


            // simulate user choosing the 1st INFO field
            infoFieldChanged();
        },

        /**
         * Performs validation on the user's current selections/entries.
         */
        validate: validate,

        /**
         * Gets a new Filter model built from the user's customizations.
         *
         * @return Filter model
         */
        getFilter: function()
        {
            // get selected VCFDataField
            var infoField = getSelectedInfoField();
            var fieldID = infoField.get("id");

            var filter = new Filter();
            filter.set("name", fieldID);
            filter.set("description", infoField.get("description"));

            var valueDiv = $("#info_value_div");
            switch (infoField.get("type"))
            {
                case VCFDataType.FLAG:
                    filter.set("category", FilterCategory.INFO_FLAG);
                    var radioId =  $('#info_flag_radio_group input[type=radio]:checked').attr('id');
                    if (radioId == 'true')
                    {
                        filter.set("value", true);
                    }
                    else
                    {
                        filter.set("value", false);
                    }
                    break;
                case VCFDataType.INTEGER:
                    filter.set("category", FilterCategory.INFO_INT);
                case VCFDataType.FLOAT:
                    filter.set("category", FilterCategory.INFO_FLOAT);
                    filter.set("value", $("#info_value_div input").val());
                    filter.set("includeNulls", ($("#include_nulls:checked").length > 0) ? true:false);
                    break;
                case VCFDataType.STRING:
                    filter.set("category", FilterCategory.INFO_STR);

                    var valueArr;

                    if ($('#info_str_value_area').length > 0)
                    {
                        // grab values from text area
                        valueArr = $('#info_str_value_area').val().split("\n");
                    }
                    else
                    {
                        // grab values from dropdown checkbox widget
                        valueArr = new Array();
                        var checkedVals = $("#info_field_dropdown_checkbox").dropdownCheckbox("checked");
                        for (var i=0; i < checkedVals.length; i++)
                        {
                            valueArr.push(checkedVals[i].label);
                        }
                    }

                    filter.set("value", valueArr);
                    filter.set("includeNulls", ($("#include_nulls:checked").length > 0) ? true:false);
                    break;
            };

            // get selected operator
            var operator = FilterOperator.EQ; // default
            var selectedOperatorOpt = $('#info_operator_list');
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
            return filter;
        }
    };

};