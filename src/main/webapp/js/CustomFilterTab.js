var CustomFilterTab = function () {

    // private variables
    var filters = new FilterList();
    var sampleGroups = new SampleGroupList();

    // register for Marionette events
    MongoApp.vent.on(MongoApp.events.WKSP_CHANGE, function (workspace) {

        // remember what the user has selected
        var selectedFilter = getSelectedFilter();

        sampleGroups.reset();
        _.each(workspace.get("sampleGroups").models, function(group) {
            sampleGroups.add(group);
        });

        filters.reset();

        // standard group filters added last
        filters.add(MongoApp.FILTER_IN_GROUP);
        filters.add(MongoApp.FILTER_NOT_IN_GROUP);
        filters.add(MongoApp.FILTER_MIN_ALT_AD);

        // reselect
        if (selectedFilter != undefined) {
            var filterName = selectedFilter.get("name");
            $("#custom_field_list option:contains('"+filterName+"')").prop('selected', true);
        }
    });

    var count = $('#group_sample_count');
    var sampleNameList = $('#group_sample_names_list');
    var groupList = $('#group_list');

    var groupListView = new GroupListView(
        {
            "el": $('#group_list'),
            "model": sampleGroups,
            "fnGroupChangeCallback": groupChanged
        }
    );

    var createGroupDialog = new CreateGroupDialog();
    $('#new_group_button').click(function (e)
    {
        createGroupDialog.show();
    });


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
    $('#custom_tab_form').validate({
            rules: {
                group_list: {
                    checkGroup: true
                },
                alt_ad_value_field: {
                    required: true,
                    number: true,
                    min: 0
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

            var filterName;
            if (filter instanceof AltAlleleDepthFilter)
                filterName = filter.displayName;
            else
                filterName = filter.get("name");

            var desc = filter.get("description");
            this.$el.append("<option value='"+filterID+"' title='"+desc+"'>"+filterName+"</option>");
        },

        selectionChanged: function(e)
        {
            customFieldChanged();
        },

        removeAll: function()
        {
            this.$el.empty();
        }
    });

    view = new ListView(
        {
            "el": $('#custom_field_list'),
            "model": filters
        }
    );

    function customFieldChanged()
    {
        // get selected filter
        var filter = getSelectedFilter();

        if (filter instanceof GroupFilter) {

            // always make sure count and sample sampleNameList
            // are cleared if no group is selected
            if (typeof groupListView.getSelectedGroup() == 'undefined')
            {
                count.empty();
                sampleNameList.empty();
            }

            $('#group_div').toggle(true);
            $('#alt_ad_div').toggle(false);

        } else if (filter instanceof AltAlleleDepthFilter) {

            $('#group_div').toggle(false);
            $('#alt_ad_div').toggle(true);

        }

        validate();
    }

    /**
     * Called when the selected group changes.
     *
     * @param group
     */
    function groupChanged(group)
    {
        count.empty();
        count.append('Number of samples: <b>' + group.get("sampleNames").length + '</b>');

        sampleNameList.empty();
        for (var i=0; i < group.get("sampleNames").length; i++)
        {
            sampleNameList.append("<option>" + group.get("sampleNames")[i] + "</option>");
        }

        validate();
    }

    function validate()
    {
        return $('#custom_tab_form').valid();
    }

    /**
     * Gets the currently selected VCFDataField model.
     *
     * @returns {*}
     */
    function getSelectedFilter()
    {
        var filterID = $('#custom_field_list').val();
        return filters.findWhere({id: filterID});
    }

    // public API
    return {
        /**
         * Resets the state of this tab.
         */
        initialize: function()
        {
            // simulate user choosing the 1st field
            customFieldChanged();
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

                    var genotype = GroupFilterGenotype.UNKNOWN;
                    switch($('form input[name=genotype]:radio:checked').val()) {
                        case 'either':
                            genotype = GroupFilterGenotype.EITHER;
                            break;
                        case 'hom':
                            genotype = GroupFilterGenotype.HOMOZYGOUS;
                            break;
                        case 'het':
                            genotype = GroupFilterGenotype.HETEROZYGOUS;
                            break;
                    }
                    filter.set("genotype", genotype);

                    var status = GroupFilterSampleStatus.UNKNOWN;
                    switch($('form input[name=sample_status]:radio:checked').val()) {
                        case 'any':
                            status = GroupFilterSampleStatus.ANY;
                            break;
                        case 'all':
                            status = GroupFilterSampleStatus.ALL;
                            break;
                    }
                    filter.set("sampleStatus", status);

                    filter.set("value", groupListView.getSelectedGroup());
                    break;
                case FilterCategory.ALT_ALLELE_DEPTH:
                    filter.set("value", $('#alt_ad_value_field').val());
                    break;
            }
            return filter;
        }

    };

};