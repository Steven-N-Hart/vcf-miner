CustomFilterTabLayout = Backbone.Marionette.Layout.extend({

    filters: new FilterList(),

    sampleGroups: new SampleGroupList(),

    template: "#custom-filter-tab-layout-template",

    regions: {},

    /**
     * Maps UI elements by their jQuery selectors
     */
    ui: {
        count: "#group_sample_count",
        sampleNameList: "#group_sample_names_list",
        groupList: "#group_list"
    },

    events: {
        "click #new_group_button" : "showCreateGroupDialog"
    },

    /**
     * Called when the view is first created
     */
    initialize: function() {

        var self = this;

        // register for Marionette events
        this.stopListening();

        // synchronize local sampleGroups when a model gets added
        var workspace = MongoApp.workspaceController.getWorkspace(MongoApp.workspaceKey);
        this.listenTo(workspace.get("sampleGroups"), "add", self.sampleGroupAdded);

        this.initWorkspace(MongoApp.workspaceKey);

        // add custom validation method for the group drowdown to make sure a group
        // is selected
        jQuery.validator.addMethod("checkGroup", function(value, element) {

            if (typeof self.groupListView.getSelectedGroup() === 'undefined')
            {
                return false;
            }
            else
            {
                return true;
            }
        }, "A group must be selected.");
    },

    initWorkspace: function(workspaceKey) {
        this.resetSampleGroups(workspaceKey);
        this.resetFilters();
    },

    resetFilters: function() {

        // remember what the user has selected
        var selectedFilter = this.getSelectedFilter();

        this.filters.reset();

        // standard group filters added last
        this.filters.add(MongoApp.FILTER_IN_GROUP);
        this.filters.add(MongoApp.FILTER_NOT_IN_GROUP);
        this.filters.add(MongoApp.FILTER_MIN_ALT_AD);

        // reselect
        if (selectedFilter != undefined) {
            var filterName = selectedFilter.get("name");
            this.$el.find("#custom_field_list option:contains('"+filterName+"')").prop('selected', true);
        }
    },

    /**
     * Synchronizes local collection by adding a model.
     * @param sampleGroup
     */
    sampleGroupAdded: function(sampleGroup) {
        this.sampleGroups.add(sampleGroup);
    },

    resetSampleGroups: function(workspaceKey) {

        var self = this;
        var workspace = MongoApp.workspaceController.getWorkspace(workspaceKey);
        this.sampleGroups.reset();
        _.each(workspace.get("sampleGroups").models, function(group) {
            self.sampleGroups.add(group);
        });
    },
    
    onShow: function() {

        this.initWorkspace(MongoApp.workspaceKey);

        var self = this;

        <!-- sub-view that renders available filters in a dropdown choicebox -->
        var ListView = Backbone.View.extend({

            initialize: function() {
                this.listenTo(this.model, 'add',    this.addOne);
                this.listenTo(this.model, 'reset',  this.removeAll);

                this.render();
            },

            /**
             * Delegated events
             */
            events: {
                "change" : "selectionChanged"
            },

            render: function() {
                var self = this;
                var filters = this.model;
                // render current filters in collection
                _.each(filters.models, function(filter) {
                    self.addOne(filter);
                });
            },

            addOne: function(filter) {
                var filterID = filter.get("id");

                var filterName;
                if (filter instanceof AltAlleleDepthFilter)
                    filterName = filter.displayName;
                else
                    filterName = filter.get("name");

                var desc = filter.get("description");
                this.$el.append("<option value='"+filterID+"' title='"+desc+"'>"+filterName+"</option>");
            },

            selectionChanged: function(e) {
                self.customFieldChanged();
            },

            removeAll: function()
            {
                this.$el.empty();
            }
        });

        new ListView({
            "el": this.$el.find('#custom_field_list'),
            "model": this.filters
        });

        // jQuery validate plugin config
        this.$el.find('#custom_tab_form').validate({
                rules: {
                    group_list: {
                        checkGroup: true
                    },
                    alt_ad_value_field: {
                        required: true,
                        number: true,
                        min: 0
                    },
                    at_least_x_samples: {
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
//                errorPlacement: function(error, element) {
//
//                    if (error.text().trim().length == 0) {
//                        element.popover('destroy');
////                        element.removeClass('control-group error');
//                        return;
//                    }
//
////                    element.parent().addClass('control-group error');
//
//                    element.popover('destroy');
//                    element.popover(
//                        {
//                            html: true,
//                            content: error,
//                            trigger: 'hover',
//                            placement: 'right'
//                        }
//                    );
//                    element.popover('show');
//                    setTimeout(function(){ element.popover('hide'); }, 3000);
//
//                }
            }
        );

        this.groupListView = new GroupListView({
            "el": this.ui.groupList,
            "model": this.sampleGroups
        });

        this.listenTo(this.groupListView, this.groupListView.EVENT_GROUP_CHANGED, function (group) {
            self.groupChanged(group);
        });

        // simulate user choosing the 1st field
        this.customFieldChanged();
    },

    validate: function() {
        return this.$el.find('#custom_tab_form').valid();
    },

    /**
     * Gets the currently selected VCFDataField model.
     *
     * @returns {*}
     */
    getSelectedFilter: function() {
        var filterID = this.$el.find('#custom_field_list').val();
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

        switch(filter.get("category"))
        {
            case FilterCategory.IN_GROUP:
            case FilterCategory.NOT_IN_GROUP:

                var genotype = GroupFilterGenotype.UNKNOWN;
                switch(this.$el.find('form input[name=genotype]:radio:checked').val()) {
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

                filter.set("atLeastXSamples", this.$el.find('form input[name=at_least_x_samples]').val());

                filter.set("value", this.groupListView.getSelectedGroup());
                break;
            case FilterCategory.ALT_ALLELE_DEPTH:
                filter.set("value", this.$el.find('#alt_ad_value_field').val());
                break;
        }
        return filter;
    },

    /**
     * Called when the selected group changes.
     *
     * @param group
     */
    groupChanged: function(group) {

        var numSamples = group.get("sampleNames").length;

        this.ui.count.empty();
        this.ui.count.append('Number of samples: <b>' + numSamples + '</b>');

        this.ui.sampleNameList.empty();
        for (var i=0; i < group.get("sampleNames").length; i++)
        {
            this.ui.sampleNameList.append("<option>" + group.get("sampleNames")[i] + "</option>");
        }

        var minSamplesInput = this.$el.find('form input[name=at_least_x_samples]');
        minSamplesInput.val(numSamples);
        minSamplesInput.rules( "add", {
            required: true,
            number: true,
            min: 0,
            max: numSamples
        });

        this.validate();
    },

    customFieldChanged: function() {
        // get selected filter
        var filter = this.getSelectedFilter();

        if (filter instanceof GroupFilter) {

            // always make sure count and sample sampleNameList
            // are cleared if no group is selected
            if (typeof this.groupListView.getSelectedGroup() == 'undefined') {
                this.ui.count.empty();
                this.ui.sampleNameList.empty();
            } else {
                this.groupChanged(this.groupListView.getSelectedGroup());
            }

            this.$el.find('#group_div').toggle(true);
            this.$el.find('#alt_ad_div').toggle(false);

        } else if (filter instanceof AltAlleleDepthFilter) {

            this.$el.find('#group_div').toggle(false);
            this.$el.find('#alt_ad_div').toggle(true);

        }

        this.validate();
    },

    showCreateGroupDialog: function() {
        var region = new Backbone.Marionette.Region({
            el: this.$el.find("#create_group_modal")
        });

        region.show(new CreateGroupDialogLayout());
    }

});