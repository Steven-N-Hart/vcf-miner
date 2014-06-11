User = Backbone.Model.extend({
    defaults: function() {

        return {
            username: 'username',
            nameFirst: 'nameFirst',
            nameLast:  'nameLast',
            email: 'email'
        };

    }
});