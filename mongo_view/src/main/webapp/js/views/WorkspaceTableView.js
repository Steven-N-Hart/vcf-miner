WorkspaceTableView = Backbone.Marionette.CompositeView.extend({

    itemView: WorkspaceTableRowView,

    // specify a jQuery selector to put the itemView instances in to
    itemViewContainer: "tbody",

    template: "#workspace-table-template",

    events: {
        "click .show-analyses": "showAnalysesDropdown",
        "click .analyze": "analyze",
        "click .delete": "deleteWorkspace",
        "click .errors": "showErrorsDialog"
    },

    ui: {
        table: "table"
    },

    itemViewOptions: function() {

        // hack for Marionette not always calling render()
        if (this.dataTable == null) {
            this.onRender();
        }

        // pass reference to DataTables widget to child views
        return {
            table: this.ui.table,
            dataTable: this.dataTable
        }
    },

    showAnalysesDropdown: function(event) {

        var dropdownButton = $(event.currentTarget);
        var workspaceKey = dropdownButton.data("wks-key");

        // dynamically populate the dropdown with the latest analyses
        var searches = MongoApp.searchController.getSearches(workspaceKey);
        var dropDownHtml='';

        if (searches.models.length == 0) {
            dropDownHtml='No saved Analyses';
        } else {
            _.each(searches.models, function(search) {
                dropDownHtml += '<li><a class="analyze" data-wks-key="' + workspaceKey + '" data-search-id="' + search.get("id") + '">' + search.get("name") + '</a></li>'
            });
        }

        var dropDownList = dropdownButton.parent().find('.dropdown-menu');
        dropDownList.html(dropDownHtml);
    },

    analyze: function(event) {
        var button = $(event.currentTarget);

        var workspaceKey = button.data("wks-key");
        var searchID = button.data("search-id");

        var workspaces = this.collection;
        var workspace = workspaces.findWhere({key: workspaceKey});

        // TODO: enhance to be the 'default' search for the workspaceKey
        var search;
        if (searchID == undefined) {
            // default is a blank search
            search = new Search();
        } else {
            var searches = MongoApp.searchController.getSearches(workspaceKey);
            search = searches.findWhere({id: searchID});
        }

        MongoApp.showPleaseWait();

        // Trigger event is fired in separate timer so that the analyze() function can complete immediately
        // This has the desired effect of the dropdown closing and the please wait dialog showing right away
        setTimeout(function() {
            MongoApp.dispatcher.trigger(MongoApp.events.WKSP_LOAD, workspace.get("key"), search);
        }, 0);

    },

    deleteWorkspace: function(event) {
        var button = $(event.currentTarget);

        var workspaceKey = button.data("wks-key");
        var workspaces = this.collection;
        var workspace = workspaces.findWhere({key: workspaceKey});

        var confirmDialog = new ConfirmDialog(
            "Delete VCF File",
            "Delete " + workspace.get('alias') + "?",
            "Delete",
            function() {
                MongoApp.dispatcher.trigger(MongoApp.events.WKSP_REMOVE, workspaceKey);
            }
        );
        confirmDialog.show();
    },

    /**
     * Triggered after the view has been rendered.
     */
    onRender: function () {

        // setup automatic type detection for sorting using MomentJS
        // this allows DataTables to properly sort the date columns
        $.fn.dataTable.moment( 'MM/DD/YYYY hh:mm A' );

        // initialize the DataTable widget
        var sDom = "<'row't>";

        this.dataTable = this.ui.table.dataTable( {
            sDom: sDom,
            aaData: [],
            iDisplayLength: 9999999, // show all in the same table w/o paging
            bAutoWidth: false,
            bScrollCollapse: true,
            bRetrieve: true,
            aaSorting: [[ 2, "desc" ]] // order on the date column descending
        });
    },

    showErrorsDialog: function(event) {
        var button = $(event.currentTarget);

        var workspaceKey = button.data("wks-key");
        var workspaces = this.collection;
        var workspace = workspaces.findWhere({key: workspaceKey});

        var region = new Backbone.Marionette.Region({el: this.$el.find("#errors_modal")});
        region.show(new ShowErrorsDialogLayout({
            model: workspace
        }));
    }
});