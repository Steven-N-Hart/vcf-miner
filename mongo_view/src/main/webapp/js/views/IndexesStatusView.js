/**
 *
 * @type {*}
 */
var IndexesStatusView = Backbone.View.extend({

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

        this.listenTo(this.model, 'change', this.update);

        this.render();
    },

    render: function()
    {
        var html =
            '<div class="form-inline"><label>Currently using <label id="index_count"></label> out of 64 available index slots.</label></div>'+
            '<div class="progress">' +
            '   <div class="bar" style="width: 0%;"></div>'
            '</div>';
        this.$el.html(html);
    },

    /**
     * Updates the ???
     *
     * @returns {*}
     */
    update: function()
    {
        var numReady = this.model.get("numReady");

        var percentUsed = (numReady / 64) * 100;

        this.$('.bar').attr("style", "width: " + percentUsed + "%;");

        this.$('#index_count').text(' ' + numReady + ' ');
    }
});