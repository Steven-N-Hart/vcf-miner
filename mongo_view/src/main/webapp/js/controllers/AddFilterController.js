AddFilterController = Backbone.Marionette.Controller.extend({

    /**
     * Shows the Add Filter dialog to the user.
     *
     * @param region
     */
    showAddFilterDialog: function(region) {

        // Marionette EventAggregator for communication controller-view and view-view communication.
        var localDispatcher = new Backbone.Wreqr.EventAggregator();

        var self = this;

        // wire up view-to-controller event handling
        localDispatcher.on('addFilter', function(filter) {
            self.addFilter(filter);
        });
        localDispatcher.on('addAnother', function(filter) {
            self.addAnother(filter);
        });
        localDispatcher.on('runCombo', function() {
            self.runComboFilter();
        });
        localDispatcher.on('cancelCombo', function() {
            self.cancelComboFilter();
        });

        var options = {
            localDispatcher: localDispatcher
        };
        region.show(new AddFilterDialogLayout(options));
    },

    reset: function() {
        this.comboFilterStep = undefined;
    },

    /**
     * Adds a filter to the collection of filterSteps that are searched
     */
    addFilter: function(filter) {

        var newFilterStep = new FilterStep();
        newFilterStep.get("filters").add(filter);

        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_ADD, newFilterStep);

        var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_CHANGED, MongoApp.search, async);

        this.reset();
    },

    /**
     * Adds a filter to the collection of filterSteps that are searched, but does not execute it right away.
     */
    addAnother: function(filter) {

        if (this.comboFilterStep == undefined) {

            // swap out buttons
            $('#run_filter').toggle();
            $('#run_combo_filter').toggle();

            this.comboFilterStep = new FilterStep();
            this.comboFilterStep.get("filters").add(filter);

            var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
            MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_ADD, this.comboFilterStep, async);
        } else {
            this.comboFilterStep.get("filters").add(filter);
            // force model change
            this.comboFilterStep.set("forceUpdate", guid());
        }

        // update button text
        $('#run_combo_filter').text('Run ' + this.comboFilterStep.get("filters").length + ' Filter(s)');
    },


    runComboFilter: function() {

        var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
        MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_CHANGED, MongoApp.search, async);

        this.reset();
    },

    cancelComboFilter: function() {

        // remove the COMBO filter step
        if (this.comboFilterStep !== undefined) {
            var async = true; // asynchronous is TRUE so that the UI can nicely show the "please wait" dialog
            MongoApp.dispatcher.trigger(MongoApp.events.SEARCH_FILTER_STEP_REMOVE, this.comboFilterStep, async);
        }

        this.reset();
    }

});
