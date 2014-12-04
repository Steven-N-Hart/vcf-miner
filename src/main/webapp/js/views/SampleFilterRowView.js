SampleFilterRowView = Backbone.Marionette.ItemView.extend({

    DROPDOWN_LIMIT: 25,

    tagName: "tr",

    template: '#sample-filter-row-template',

    events: {
        // Listen for changes to the field name combobox
        "change #fieldDropdown" : "fieldChanged",

        // Listen for clicks on the 'X' button
        "click .removeFilter"   : "removeFilter",

        // Look for all clicks on checkboxes within the row (for the checkbox combobox)
        "change input[type='checkbox']" : "changeCheckboxComboboxValue"
    },

    // stickit 2-way binding setup
    bindings: {

        //=================================================================================
        // Field dropdown
        //=================================================================================

        //-------------------------------------------------------------------------
        // field dropdown  (the first combobox on the left of a filter row for the field name)
        // the <option> element value correspond to the SampleMetadataField's "id" attribute
        //-------------------------------------------------------------------------
        '#fieldDropdown': {
            observe: 'metadataField',
            onGet: function(value, options) {
                if (value == null) {
                    // no value is set, show the "Select A Field" option
                    return "none";
                } else {
                    // return the "id" to match the select#value attribute
                    return value.get("id");
                }
            },
            onSet: function(value, options) {
                // use the "id" to lookup the SampleMetadataField
                var fieldID = value;
                var metadataField = this.options.metadataFields.findWhere({id: fieldID});
                return metadataField;
            }
        },

        //=================================================================================
        // Comparator drop-down
        //=================================================================================

        // Bind the number comparator to the "operator" field in the SampleFilter model
        '#numberComparatorDropdown': 'operator',

        // Bind the string comparator to the "operator" field in the SampleFilter model
        '#stringComparatorDropdown': 'operator',

        // NOTE: boolean comparator should default to "=", and should not need to change



        //=================================================================================
        // Values for string, number, boolean
        //=================================================================================

        // Bind the string values text field to the "values" field in the SampleFilter model
        // NOTE: Since we are using multi-select checkboxes and type-aheads, this will not be a simple mapping - so have added specialized ones below
        //'#stringValue': 'values',

        // Bind the number value text field to the "values" field in the SampleFilter model
        // NOTE: This will treat the number as a STRING - so instead, add getter/setter to allow us to convert to numberic type
        //'#numberValue': 'values',

        // Bind the boolean value radio button to the "values" field in the SampleFilter model
        // NOTE: This will treat the number as a STRING - so instead, add getter/setter to allow us to convert to boolean type
        //'#boolean_group': 'values',

        //----------------------------------------------------------------------------------------------
        // Boolean selection:  (turn the string value into boolean)
        //----------------------------------------------------------------------------------------------

        // radio button group
        '#boolean_group': {
            observe: 'values',

            onGet: function(value, options) {
                // If not defined, then return TRUE
                if( ! value )
                    return true;
                // If not a boolean type, then compare to "true" string
                if( typeof value != "boolean" ) {
                    return "true" == value.toLowerCase();
                }
                return value;
            },

            onSet: function(value, options) {
                // If not defined, then return TRUE
                if( ! value )
                    return true;
                // If not a boolean type, then compare to "true" string
                if( typeof value != "boolean" ) {
                    return "true" == value.toLowerCase();
                }
                return value;
            }

        },


        //----------------------------------------------------------------------------------------------
        // Numeric value field:  (turn the string from the text field into a numeric)
        //----------------------------------------------------------------------------------------------
        // TODO: Change this to match numeric fields
        '#numberValue': {
            observe: 'values',
            onGet: function(value, options) {

                if (value == null) {
                    return 0;
                }

                // return the boolean as a string, which will match the input#value attribute
                return value.toString();

            },
            onSet: function(value, options) {
                return value;
            }
        }
        //----------------------------------------------------------------------------------------------
        // String - checkbox multi-select for sample names
        //----------------------------------------------------------------------------------------------
        // TODO:  Need to add and fix this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        /*
        '#sample_metadata_dropdown_checkbox': {
        //'.sample_metadata_dropdown_checkbox': {
        //'.dropdown': {
            // TODO: May need to be changed to reflect multiple values
            observe: 'values',
            onGet: function(values, options) {
                if( values == null ) {
                    return new Array();
                }
                return values.toString();
            },
            onSet: function(values, options) {
                return values;
            }
        },
        */

        //----------------------------------------------------------------------------------------------
        // String - type-ahead multi-select for sample names
        //----------------------------------------------------------------------------------------------
        // TODO:  Need to add and fix this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        /*
        '.sample_metadata_typeahead': {
            // TODO: May need to be changed to reflect multiple values
            observe: 'values',
            onGet: function(values, options) {
                if( values == null ) {
                    return new Array();
                }
                return values.toString();
            },
            onSet: function(values, options) {
                return values;
            }
        }
        */
    },

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options) {
        // rebind so that options can be access in other functions
        // Should get:
        //    metadataFieldList  (SampleMetadataList)
        //    sampleNameArray (array of strings containing sample names)
        //    samplesAllList (list of ALL Sample objects)
        this.options = options;

        this.listenTo(this.model, 'change:isLast', this.updateAddFilterVisibility);
    },

    /**
     * Triggered after the view has been rendered.
     */
    onRender: function() {

        // populate the field dropdown
        var fieldDropdown = this.$el.find('#fieldDropdown');
        _.each(this.options.metadataFields.models, function(metadataField) {
            var fieldID = metadataField.get("id");
            var desc =    metadataField.get("desc");
            fieldDropdown.append("<option value='"+fieldID+"' title='"+desc+"'>"+fieldID+"</option>");
        });

        // all regions should be hidden by default
        this.$el.find('.sample_filter_region').toggle(false);

        this.stickit();

        // Change the names of the radio button group so that it is unique for this row
        this.changeBooleanRadioButtonGroupNames();
    },


    /** When adding a filter, make sure to change the boolean radio button group name so they are unique.
     *  Otherwise if there are 3 boolean filters each with a true/false radio button pair, only one radio button could be selected out of the six.
     */
    changeBooleanRadioButtonGroupNames : function() {
        // Get the radio buttons in the radio button group under the current row
        var radioButtons = this.$el.find("#boolean_group");

        // There should be two elements found, so change the name of each by appending the index
        // Increment the index to make the boolean radio button group unique
        var idx = this.getUniqueId();
        for( var i=0; i < radioButtons.length; i++) {
            var newName = radioButtons[i].name + "_" + idx;
            radioButtons[i].name = newName;
        }
    },

    /** Get a unique id.  This will increment the id every time this function is called.
     *  See: http://stackoverflow.com/questions/1535631/static-variables-in-javascript
     * @returns {number}
     */
    getUniqueId : function() {
        // Check to see if the counter was initialized, and if not, initialize it to 0
        // The variable is associated with the function which appears to be static across all instances
        if( typeof this.getUniqueId.counter == 'undefined' ) {
            this.getUniqueId.counter = 0;
        }
        return ++this.getUniqueId.counter;
    },

    /**
     * Dynamically alters the tab's "operator" and "values" areas based on
     * the selected field.
     *
     * @param event
     */
    fieldChanged: function(event) {
        var dropdown = $(event.target);

        // determine what SampleMetadataField model was selected
        var fieldID = dropdown.val();
        var metadataField = this.options.metadataFields.findWhere({id: fieldID});

        // all regions should be hidden (below we will make visible the correct region)
        this.$el.find('.sample_filter_region').toggle(false);


        // based on the type, do the following:
        // 1. make visible the corresponding region
        // 2. set default values for the SampleFilter model
        switch (metadataField.get("type")) {
            case SampleMetadataFieldType.BOOLEAN:
                // defaults
                this.model.set("operator", SampleFilterOperator.EQ);
                this.model.set("values", true);
                // make region visible
                this.$el.find('#booleanRegion').toggle(true);
            break;
            case SampleMetadataFieldType.INTEGER:
            case SampleMetadataFieldType.FLOAT:
                // defaults
                this.model.set("operator", SampleFilterOperator.EQ);
                this.$el.find('#numberRegion').toggle(true);
                break;
            case SampleMetadataFieldType.STRING:
                // Defaults
                this.model.set("operator", SampleFilterOperator.EQ);
                this.$el.find('#stringRegion').toggle(true);
                this.showStringFilter(metadataField);
                break;
            default:
                break;
        }
    },

    //---------------------------------------------------------------------------------------------------------
    // TODO: When fetching the sampleNamesArray, we want to get a count of the # of names first.
    //       There are two components that will tie to this count: checkbox-dropdown, and type-ahead textfield & textarea
    //       If count <= DROPDOWN_LIMIT:
    //          show the checkbox-dropdown
    //          hide the type-ahead components
    //          fetch the list of sample names immediately and add to the checkbox-dropdown
    //       Else if count > DROPDOWN_LIMIT:
    //          show the type-ahead components
    //          and hide the checkbox-dropdown
    //          Setup a listener on the type-ahead to do a synchronous REST call to the mongo_svr to fetch the matches (up to a 100?)
    //---------------------------------------------------------------------------------------------------------
    showStringFilter: function(metadataField) {

        var fieldValues = this.getFieldValues(metadataField);

        if ( fieldValues.length <= this.DROPDOWN_LIMIT ) {

            //------------------------------------------------------------------------------
            // Dropdown combobox
            //------------------------------------------------------------------------------
            // setup the dropdown checkbox
            var dropdownData = new Array();
            // Loop through the data and add one line for each String in the string array
            for (var i=0; i < fieldValues.length; i++) {
                dropdownData.push({id: i + 1, label: fieldValues[i]});
            }

            var dropdownCheckbox = this.$el.find("#sample_metadata_dropdown_checkbox");
            var typeAheadComponent = this.$el.find("#sample_metadata_typeahead");

            // Make sure the dropdownCheckbox is visible, and the type-ahead section is hidden
            dropdownCheckbox.show();
            typeAheadComponent.hide();

            // Set the data inside the checkbox
            dropdownCheckbox.dropdownCheckbox({
                autosearch: true,
                hideHeader: false,
                data: dropdownData
            });

            // set the max width of the dropdown checkbox widget to be that of the parent DIV container
            // this will prevent the widget from getting too wide when long string values are present
            dropdownCheckbox.find('.dropdown-menu').css('max-width', '100%');

        } else {

            //------------------------------------------------------------------------------
            // TODO: Typeahead
            //------------------------------------------------------------------------------

            var dropdownCheckbox = this.$el.find("#sample_metadata_dropdown_checkbox");
            var typeAheadComponent = this.$el.find("#sample_metadata_typeahead");

            // Make sure the type-ahead section is visible, and the dropdown-checkbox section is hidden
            typeAheadComponent.show();
            dropdownCheckbox.hide();

        }
    },

    /** Listen for a change to a checkbox within the checkbox-combobox items */
    changeCheckboxComboboxValue : function(event) {
        // Get the checkbox component that was clicked/changed
        var checkboxElement = $(event.target);
        // Get the ancestor component that has the id of the div containing the checkbox-combobox
        var dropdownCheckboxDiv = checkboxElement.parents("#sample_metadata_dropdown_checkbox");

        // Get the list of all selected checkbox items
        var selectedItems = dropdownCheckboxDiv.dropdownCheckbox("checked");
        var filterObj = this.model;

        // Set the filter's values to the selectedItems
        var values = new Array();
        for(var i=0; i < selectedItems.length; i++) {
            var val = selectedItems[i].label;
            values.push(val);
        }
        filterObj.set("values", values);
    },
    removeFilter: function(event) {
        // fire event that this model should be removed
        MongoApp.vent.trigger("removeFilter", this.model);
    },

    updateAddFilterVisibility: function() {
        var isLast = this.model.get("isLast");
        var addFilterButton = this.$el.find('.addFilter');

        if (isLast) {
            addFilterButton.toggle(true);
        } else {
            addFilterButton.toggle(false);
        }
    },

    /** Given a metadataField, find all values from all samples that match that field Id.
     *  This will be used for the string-filter checkbox-combobox */
    getFieldValues: function (metadataField) {
        var values = new Array();
        // Loop through the samples:
        //   Get the key-value pairs, and if the metadataField id matches the key, add all the values for that key to the list
        for(var i=0; i < this.options.samplesAllList.length; i++) {
            var fieldKeyValPairs = this.options.samplesAllList.models[i].get("sampleMetadataFieldKeyValuePairs");
            var valuesForField = fieldKeyValPairs[metadataField.id];
            values = values.concat(valuesForField);
        }
        values.sort();
        return values;
    },

    /**
     * For the given {@link SampleMetadataField} of type {@link SampleMetadataFieldType#string},
     * get the possible string values based on the given text string already typed by the user.
     *
     * @param metadataField The ##META to get possible values for.
     * @param text The text value typed by the user.
     *
     * @returns A {@link Array} of strings that represent the possible values.
     *
     * This will be used for the string-filter type-ahead fields
     */
    getFieldValuesForTypeAhead: function (metadataField, text) {
        var valuesFiltered = new Array();
        // TODO: hardcoded stubs - make this a REST call back to the server
        var valuesFull = this.getFieldValues(metadataField);
        for (var i = 0; i < valuesFull.length; i++) {
            if (valuesFull[i].indexOf(text) != -1)
                valuesFiltered.push(valuesFull[i]);
        }
        return valuesFiltered;
    }
});