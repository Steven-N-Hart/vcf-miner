var SampleGroupListView = function (sampleGroups) {

    // private variables
    var view;

    /**
     * Single option in list.
     * @type {*}
     */
    var OptionView = Backbone.View.extend({

        tagName: "option",

        initialize: function()
        {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function()
        {
            this.$el.text(this.model.get("name"));
            this.$el.attr( 'id', this.model.get("id"));
            this.$el.attr( 'value', this.model.get("id"));

            return this;
        }
    });

    /**
     * Overall view for entire list.  Contains a nested view per list option.
     * @type {*}
     */
    var ListView = Backbone.View.extend({
        el: $("#group_list"),

        initialize: function()
        {
            this.listenTo(sampleGroups, 'add',    this.addOne);
            this.listenTo(sampleGroups, 'remove', this.removeOne);
            this.listenTo(sampleGroups, 'reset',  this.removeAll);
        },

        render: function()
        {
        },

        addOne: function(group)
        {
            var view = new OptionView({model: group});
            this.$el.append(view.render().el);
        },

        removeOne: function(group)
        {
            // remove element with corresponding group ID from DOM
            this.$("#" + group.get("id")).remove();
        },

        removeAll: function()
        {
            this.$el.empty();
        }
    });

    view = new ListView();

    // public API
    return {
    };

};