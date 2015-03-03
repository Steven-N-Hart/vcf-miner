CreateGroupDialogLayout = Backbone.Marionette.Layout.extend({

    filters: new FilterList(),
    workspaceKey: null,
    allSampleNames: null,
    sampleGroups: null,

    template: "#create-group-dialog-layout-template",

    regions: {},

    ui: {
        availableSamplesList: "#available_samples_list",
        groupSamplesList: "#group_samples_list",
        groupNameField: "#group_name_field"
    },

    events: {
        "click .add-samples" : "addSamples",
        "click .remove-samples" : "removeSamples"
    },

    /**
     * Called when the view is first created
     */
    initialize: function() {
        var workspace = MongoApp.workspace;
        this.workspaceKey   = workspace.get("key");
        this.allSampleNames = workspace.get("sampleNames");
        this.sampleGroups   = workspace.get("sampleGroups");
    },

    onShow: function() {

        var self = this;

        // jQuery validate plugin config
        this.$el.find('#create_group_form').validate( {
                rules: {
                    group_name_field: {
                        required: true,
                        minlength: 1
                    }
                },
                submitHandler: function(form) {
                    self.create();
                    self.close();
                },
                highlight: function(element) {
                    $(element).parent().addClass('control-group error');
                },
                success: function(element) {
                    $(element).parent().removeClass('control-group error');
                }
            }
        );

        // populate list of all sample names
        for (var i=0; i < this.allSampleNames.length; i++) {
            var sampleName = this.allSampleNames[i];
            this.ui.availableSamplesList.append("<option value='"+sampleName+"'>" + sampleName + "</option>");
        }

        <!-- sub-view that renders available filterSteps in a dropdown choicebox -->
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

        // show modal dialog
        this.$el.parents('.modal').modal();
    },

    /**
     * Create a new group
     */
    create: function() {
        var group = new SampleGroup();
        group.set("name", this.ui.groupNameField.val());
        group.set("description", '');

        var sampleNames = $.map(this.ui.groupSamplesList.find('option'), function(e) { return e.value; });
        group.set("sampleNames", sampleNames);

        MongoApp.dispatcher.trigger(MongoApp.events.WKSP_GROUP_CREATE, group, MongoApp.workspace);
    },

    addSamples: function() {
        var self = this;
        this.ui.availableSamplesList.find('option:selected').each(function()
        {
            var sampleName = $(this).val();
            self.ui.groupSamplesList.append("<option>" + sampleName + "</option>");

            // remove option from available list
            $(this).remove();
        });
    },

    removeSamples: function() {
        var self = this;
        this.ui.groupSamplesList.find('option:selected').each(function()
        {
            var sampleName = $(this).val();
            self.ui.availableSamplesList.append("<option value='"+sampleName+"'>" + sampleName + "</option>");

            // remove option from available list
            $(this).remove();
        });
    },

    onClose: function() {
        this.$el.parents('.modal').modal('hide');
    }

});