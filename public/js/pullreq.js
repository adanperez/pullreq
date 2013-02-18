
var PullReq = PullReq || {};

(function(PullReq) {

    PullReq.VERSION = "0.1.0";

    PullReq.models  = {
        PullRequest: Backbone.Model.extend({}),
        User: Backbone.Model.extend({}),
        RepoOwner: Backbone.Model.extend({}),
        Project: Backbone.Model.extend({
            defaults: {
                name:'',
                projectId:''
            },
            validate: function(attrs) {
                if (attrs.name == undefined || attrs.name == null) {
                    return 'Name cannot be null';
                }
            },
            initialize: function() {
                this.set('pullRequests', new PullReq.collections.PullRequests());
            }
        })
    };

    PullReq.collections  = {
        RepoOwners: Backbone.Collection.extend({
            url: '/api/repoOptions',
            model: PullReq.models.RepoOwner
        }),
        Projects: Backbone.Collection.extend({
            url: '/api/pullRequests',
            model: PullReq.models.Project,
            parse: function(data) {
                if (!data) {
                    return [];
                }
                return data;
            }
        }),
        PullRequests: Backbone.Collection.extend({
            model: PullReq.models.PullRequest
        })
    };

    PullReq.views  = {
        RepoOwners: Backbone.View.extend({
            el: $("#owners"),
            template: Handlebars.compile($("#repo-owner-template").html()),
            //events: {
            //    'submit #repoForm': 'saveToModel'
            //},
            render: function() {
                var view = this;
                this.$el.fadeOut(100, function() {
                    $('#loadingMessage').html('Choose your repos');
                    view.$el.empty();
                    view.collection.each(view.makeView, view);
                    view.$el.fadeIn(200, function() {
                        $('#saveButton').show();
                    });
                });
                return this;
            },
            makeView: function(repo) {
                this.$el.append(this.template(repo.toJSON()))
            },
            initialize: function () {
                this.collection = new PullReq.collections.RepoOwners();
                this.collection.bind("reset", this.render, this);
                this.collection.fetch();
            }
        }),
        PullRequest: Backbone.View.extend({
            //tagName: 'div',
            //className:'pull-request',
            template: Handlebars.compile($("#pull-template").html()),
            render: function() {
                this.$el.html( this.template( this.model.toJSON()));
                return this;
            }
        }),
        Project: Backbone.View.extend({
            //tagName: 'div',
            //className: 'project',
            template: Handlebars.compile($("#project-template").html()), // handlbars goes here,
            events: {
                'click .edit': function() { console.log('Clicked me')},
                'click .del': 'del'
            },
            del: function() {
                this.model.destroy();
            },
            remove: function() {
                this.$el.remove();
            },
            initialize: function() {
                this.model.on('change', this.render, this);
                this.model.on('destroy', this.remove, this);
            },
            render: function() {
                this.$el.html( this.template(this.model.toJSON()));
                this.model.get('pullRequests').each(function(pullRequest){
                    var pullView = new PullReq.views.PullRequest({model:pullRequest});
                    this.$('.pull-requests').append(pullView.render().el)
                }, this);
                return this;
            }
        }),
        Projects: Backbone.View.extend({
            tagName:'div',
            initialize: function() {
                this.collection.on('add', this.addProjectView, this);
            },
            render: function() {
                this.collection.each(this.addProjectView, this); //passing in scope/context beacuse each is anonomyous function
                return this;
            },
            addProjectView: function(project) {
                var projectView = new PullReq.views.Project({model:project});
                this.$el.append(projectView.render().el)
            }
        })
    };

    PullReq.data = {
        views: {},
        collections: {},
        models: {}
    };

}(PullReq));
