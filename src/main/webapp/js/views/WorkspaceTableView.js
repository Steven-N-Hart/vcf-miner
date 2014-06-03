WorkspaceTableView = Backbone.Marionette.CompositeView.extend({

    itemView: WorkspaceTableRowView,

    // specify a jQuery selector to put the itemView instances in to
    itemViewContainer: "tbody",

    template: "#workspace-table-template",

    events: {
        "click .show-analyses": "showAnalysesDropdown",
        "click .analyze": "analyze",
        "click .delete": "delete"
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

        // TODO: enhance to be the 'default' search for the workspace
        var search;
        if (searchID == undefined) {
            // default is a blank search
            search = new Search();
        } else {
            var searches = MongoApp.searchController.getSearches(workspaceKey);
            search = searches.findWhere({id: searchID});
        }

        MongoApp.vent.trigger(MongoApp.events.WKSP_LOAD, workspace, search);
    },

    delete: function(event) {
        var button = $(event.currentTarget);

        var workspaceKey = button.data("wks-key");
        var workspaces = this.collection;
        var workspace = workspaces.findWhere({key: workspaceKey});

        var confirmDialog = new ConfirmDialog(
            "Delete VCF File",
            "Delete " + workspace.get('alias') + "?",
            "Delete",
            function() {
                MongoApp.vent.trigger(MongoApp.events.WKSP_REMOVE, workspace);
            }
        );
        confirmDialog.show();
    },

    /**
     * Triggered after the view has been rendered.
     */
    onRender: function () {
        // initialize the DataTable widget
        var sDom = "<'row't>";

        this.$el.find('table').dataTable( {
            "sDom": sDom,
            'aaData': [],
            "iDisplayLength": 25,
            "bAutoWidth": false,
            "bScrollCollapse": true
        });
    }
});