/**
 *
 * @type {*}
 */
var IndexTableRowView = Backbone.View.extend({

    /**
     * Called when the view is first created
     *
     * @param options
     *      All options passed to the constructor.
     *
     */
    initialize: function(options)
    {
        // rebind so that options can be access in other functions
        this.options = options;

        this.listenTo(this.model, 'change', this.updateRow);
    },

    /**
     * Updates the row in the DataTable widget.
     *
     * @returns {*}
     */
    updateRow: function()
    {
        var index = this.model;

        // remove element with corresponding ID from DOM
        var id = index.get("dataField").get("id");
        var nRow =  $('#'+this.options.tableId+' tbody tr[id='+id+']')[0];

        var dataTable = $('#'+this.options.tableId).dataTable();
        dataTable.fnUpdate( this.toAaDataRow(index), nRow );
        dataTable.fnDraw();
    },

    /**
     * Translates the given DatabaseIndex model object into an aaDataRow expected by the DataTables widget.
     *
     * @param index
     */
    toAaDataRow: function(index)
    {
        var id = index.get("dataField").get("id");
        var name = index.get("dataField").get("id");

        var nameHtml = "<div class='ellipsis' title='"+name+"'>"+name+"</div>";
        var statusLabel = $("<label>"+this.getDisplayStatus(index)+"</label>");

        var onRadioButton  = $('<input data-field-id="'+id+'" type="radio" class="evt_create_idx" name="index_group_'+id+'" value="on">');
        var offRadioButton = $('<input data-field-id="'+id+'" type="radio" class="evt_delete_idx" name="index_group_'+id+'" value="off">');

        var onLabel = $("<label class='radio inline' style='margin-right:20px;'></label>");
        var offLabel = $("<label class='radio inline' style='margin-right:20px;'></label>");

        switch(index.get("status"))
        {
            case IndexStatus.NONE:
                offRadioButton.attr("checked", "true");
                statusLabel.addClass("text-error");
                offLabel.addClass("text-error");
                break;
            case IndexStatus.READY:
                onRadioButton.attr("checked", "true");
                statusLabel.addClass("text-success");
                onLabel.addClass("text-success");
                break;
            case IndexStatus.BUILDING:
                statusHtml += '<div class="progress"><div class="bar" style="width: '+index.get("progress")+'%;"></div></div>';
                break;
        }

        onLabel.append(onRadioButton);
        onLabel.append("On");
        offLabel.append(offRadioButton);
        offLabel.append("Off");

        var tmp = $('<div/>');
        tmp.append(onLabel);
        tmp.append(offLabel);
        var actionHtml = tmp.html();

        var statusHtml = ($('<div/>').append(statusLabel)).html();

        var aaDataRow =
        {
            "DT_RowId": id,
            "0": nameHtml,
            "1": statusHtml,
            "2": actionHtml
        };

        return aaDataRow;
    },

    /**
     * Gets human readable display status for the given index.
     *
     * @param workspace
     * @returns {string}
     */
    getDisplayStatus: function(index)
    {
        switch(index.get("status"))
        {
            case IndexStatus.NONE:
                return "No index";
            case IndexStatus.BUILDING:
                return "Building";
            case IndexStatus.DROPPING:
                return "Deleting";
            case IndexStatus.READY:
                return "Ready";
            default:
                return "";
        }
    }
});