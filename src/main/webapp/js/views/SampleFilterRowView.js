SampleFilterRowView = Backbone.Marionette.ItemView.extend({

    DROPDOWN_LIMIT: 25,

    tagName: "tr",

    template: '#sample-filter-row-template',

    events: {
        "change #fieldDropdown" : "fieldChanged",
        "click .removeFilter"   : "removeFilter"
    },

    // stickit 2-way binding setup
    bindings: {

        // field dropdown
        // the <option> element value correspond to the SampleMetadataField's "id" attribute
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

        // Bind the number comparator to the "operator" field in the SampleFilter model
        '#numberComparatorDropdown': 'operator',

        // Bind the string comparator to the "operator" field in the SampleFilter model
        '#stringComparatorDropdown': 'operator',

        // Bind the string values text field to the "values" field in the SampleFilter model
        '#stringValue': 'values',

        // Bind the number value text field to the "values" field in the SampleFilter model
        // NOTE: This will treat the number as a STRING
        //'#numberValue': 'values',

        // Bind the boolean value radio button to the "values" field in the SampleFilter model
        // NOTE: This will treat the number as a STRING
        //'#boolean_group': 'values',

        //----------------------------------------------------------------------------------------------
        // Boolean:  (turn the string value into boolean)
        //----------------------------------------------------------------------------------------------
        // radio button group
        '.boolean_group': {
            observe: 'values',
            onGet: function(value, options) {
                // If the value is either not defined or is "true", then return true
                return (! value  ||  "true" == value.toLowerCase());
            },
            onSet: function(value, options) {
                return  (value.toLowerCase() == "true");
            }
        },


        //----------------------------------------------------------------------------------------------
        // Numeric:  (turn the string from the text field into a numeric)
        //----------------------------------------------------------------------------------------------
        // TODO: Add comparator....   ("numberComparatorDropdown")

        // Number field
        // TODO: Change this to match numeric fields
        '.numberValue': {
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
        },
        //----------------------------------------------------------------------------------------------
        // String:
        //----------------------------------------------------------------------------------------------
        // String comparator dropdown
        // TODO:  Need to add and fix this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        '.stringComparatorDropdown': {

        },

        // String checkbox group for the sample names
        // TODO:  Need to add and fix this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        '.sample_metadata_dropdown_checkbox': {
            // TODO: May need to be changed to reflect multiple values
            observe: 'value',
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
        this.options = options;

//        this.listenTo(this.model, 'change', this.render);
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
    },

    /**
     * Dynamically alters the tab's "operator" and "values" areas based on
     * the selected field.
     *
     * @param event
     */
    fieldChanged: function(event) {
        var dropdown = $(event.target);

        // determine what model was selected
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

        var count = this.options.countFunction(metadataField);
        if ( count <= this.DROPDOWN_LIMIT ) {

            //------------------------------------------------------------------------------
            // Dropdown combobox
            //------------------------------------------------------------------------------
            // setup the dropdown checkbox
            var dropdownData = new Array();
            // Loop through the data and add one line for each String in the string array
            var valuesArr = this.options.valuesFunction(metadataField);
            for (var i=0; i < valuesArr.length; i++) {
                dropdownData.push({id: i + 1, label: valuesArr[i]});
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
    }
});