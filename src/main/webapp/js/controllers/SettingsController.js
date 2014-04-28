SettingsController = Backbone.Marionette.Controller.extend({

    initialize: function (options) {

        var self = this;

        // Wire events to functions
        MongoApp.on(MongoApp.events.WKSP_CHANGE, function (workspace) {
            self.changeWorkspace(workspace);
        });

        // jQuery validate plugin config
        $('#settings_general_form').validate(
            {
                rules:
                {
                    max_filtered_variants_field: {
                        required: true,
                        integer: true,
                        min:1
                    },
                    popover_time_field: {
                        required: true,
                        integer: true,
                        min:0,
                        max:10
                    },
                    max_filter_values_field: {
                        required: true,
                        integer: true,
                        min:1
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

        var fieldMaxFilteredVariants = $('#max_filtered_variants_field');
        MongoApp.settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
        fieldMaxFilteredVariants.change(function(event) {

            if (fieldMaxFilteredVariants.valid() == true){
                MongoApp.settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
            }

        });

        var fieldPopoverTime = $('#popover_time_field');
        MongoApp.settings.popupDuration = fieldPopoverTime.val();
        fieldPopoverTime.change(function(event) {

            if (fieldPopoverTime.valid() == true){
                MongoApp.settings.popupDuration = fieldPopoverTime.val();
            }

        });

        var fieldMaxFilterValues = $('#max_filter_values_field');
        MongoApp.settings.maxFilterValues = fieldMaxFilterValues.val();
        fieldMaxFilterValues.change(function(event) {

            if (fieldMaxFilterValues.valid() == true){
                MongoApp.settings.maxFilterValues = fieldMaxFilterValues.val();
            }

        });

        var fieldShowMissingIdxWarnings = $('#show_missing_index_warnings');
        fieldShowMissingIdxWarnings.change(function(event) {

            var checkbox = event.currentTarget;
            if (checkbox.checked) {
                MongoApp.settings.showMissingIndexWarning = true;
            } else
            {
                MongoApp.settings.showMissingIndexWarning = false;
            }
        });
    },

    showSettingsTab: function (options) {

        new IndexesStatusView(
            {
                "el": $('#indexes_status_div'),
                "model": MongoApp.indexController.getOverallIndexStatus()
            }
        );

        new IndexTableView(
            {
                "el": $('#general_indexes_table_div'),
                "model": MongoApp.indexController.getGeneralIndexes(),
                "sortable":false,
                "createIndexCallback": MongoApp.indexController.createIndex,
                "dropIndexCallback": MongoApp.indexController.deleteIndex
            }
        );
        new IndexTableView(
            {
                "el": $('#info_indexes_table_div'),
                "model": MongoApp.indexController.getInfoIndexes(),
                "sortable":true,
                "createIndexCallback": MongoApp.indexController.createIndex,
                "dropIndexCallback": MongoApp.indexController.deleteIndex
            }
        );
        new IndexTableView(
            {
                "el": $('#format_indexes_table_div'),
                "model": MongoApp.indexController.getFormatIndexes(),
                "createIndexCallback": MongoApp.indexController.createIndex,
                "dropIndexCallback": MongoApp.indexController.deleteIndex
            }
        );

        // TODO:
//        options.region.show(searchFilterView);
    },

    changeWorkspace: function(workspace) {
        MongoApp.indexController.initialize(workspace.get("key"), workspace.get("dataFields"));
        MongoApp.indexController.refreshIndexes();
    }

});