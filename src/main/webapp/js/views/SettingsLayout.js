SettingsLayout = Backbone.Marionette.Layout.extend({

    template: "#settings-layout-template",

    regions: {
    },

    onShow: function() {

        // jQuery validate plugin config
        this.$el.find('#settings_general_form').validate(
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

        var fieldMaxFilteredVariants = this.$el.find('#max_filtered_variants_field');
        MongoApp.settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
        fieldMaxFilteredVariants.change(function() {

            if (fieldMaxFilteredVariants.valid() == true){
                MongoApp.settings.maxFilteredVariants = fieldMaxFilteredVariants.val();
            }

        });

        var fieldPopoverTime = this.$el.find('#popover_time_field');
        MongoApp.settings.popupDuration = fieldPopoverTime.val();
        fieldPopoverTime.change(function() {

            if (fieldPopoverTime.valid() == true){
                MongoApp.settings.popupDuration = fieldPopoverTime.val();
            }

        });

        var fieldMaxFilterValues = this.$el.find('#max_filter_values_field');
        MongoApp.settings.maxFilterValues = fieldMaxFilterValues.val();
        fieldMaxFilterValues.change(function() {

            if (fieldMaxFilterValues.valid() == true){
                MongoApp.settings.maxFilterValues = fieldMaxFilterValues.val();
            }

        });

        var fieldShowMissingIdxWarnings = this.$el.find('#show_missing_index_warnings');
        fieldShowMissingIdxWarnings.change(function(event) {

            var checkbox = event.currentTarget;
            if (checkbox.checked) {
                MongoApp.settings.showMissingIndexWarning = true;
            } else
            {
                MongoApp.settings.showMissingIndexWarning = false;
            }
        });


        new IndexesStatusView(
            {
                "el": this.$el.find('#indexes_status_div'),
                "model": MongoApp.indexController.getOverallIndexStatus()
            }
        );

        new IndexTableView(
            {
                "el": this.$el.find('#general_indexes_table_div'),
                "model": MongoApp.indexController.getGeneralIndexes(),
                "sortable":false,
                "createIndexCallback": MongoApp.indexController.createIndex,
                "dropIndexCallback": MongoApp.indexController.deleteIndex
            }
        );
        new IndexTableView(
            {
                "el": this.$el.find('#info_indexes_table_div'),
                "model": MongoApp.indexController.getInfoIndexes(),
                "sortable":true,
                "createIndexCallback": MongoApp.indexController.createIndex,
                "dropIndexCallback": MongoApp.indexController.deleteIndex
            }
        );
        new IndexTableView(
            {
                "el": this.$el.find('#format_indexes_table_div'),
                "model": MongoApp.indexController.getFormatIndexes(),
                "createIndexCallback": MongoApp.indexController.createIndex,
                "dropIndexCallback": MongoApp.indexController.deleteIndex
            }
        );
    }

});