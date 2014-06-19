MainHeaderUserLayout = Backbone.Marionette.Layout.extend({

    template: "#main-header-user-layout-template",

    events: {
//        "click .user-info" : "userInfo",
        "click .logout" : "logout"
    },

    popoverTemplate: $("#main-header-user-popover-template").html(),

    onShow: function() {
        this.popover = this.$el.find(".user-info").popover({
            placement: 'bottom',
            title: 'User Information',
            html: true,
            content: _.template(this.popoverTemplate, this.model.attributes)
        });

        // override the default bootstrap popover width to be wider
        this.popover.on("shown.bs.popover", function(){
            var popoverDiv = $(this).parent().find('.popover');
            popoverDiv.css("max-width", "350px");
            popoverDiv.css("width", "350px");
        });
    },

    onClose: function() {
        this.popover.off();
    },

    logout: function() {
        MongoApp.dispatcher.trigger(MongoApp.events.LOGOUT, MongoApp.user.get("token"));
    }
});