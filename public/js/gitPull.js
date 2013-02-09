
this.GitPull = {};

(function(GitPull) {

    GitPull.VERSION = "0.0.1";

    GitPull.models  = {

        PullRequest: Backbone.Model.extend({}),

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
                this.set('pullRequests', new GitPull.collections.PullRequests());
            }
        }),

        User: Backbone.Model.extend({
            defaults: {
                name:'',
                imageUrl:''
            }
        })
    };

    GitPull.collections  = {

        Projects: Backbone.Collection.extend({
            model: GitPull.models.Project
        }),

        PullRequests: Backbone.Collection.extend({
            model: GitPull.models.PullRequest
        })
    };

    GitPull.views  = {

        PullRequest: Backbone.View.extend({
            //tagName: 'div',
            //className:'pull-request',
            template: Handlebars.compile($("#pull-template").html()),
            render: function() {
                //this.$el.html(this.model.get('name'))
                this.$el.html( this.template( this.model.toJSON()));
                return this;
            }
        }),

        Project: Backbone.View.extend({
            //tagName: 'div',
            //className: 'project',
            template: Handlebars.compile($("#project-template").html()), // handlbars goes here,
            //TODO look up other events
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
                    var pullView = new GitPull.views.PullRequest({model:pullRequest});
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
                var projectView = new GitPull.views.Project({model:project});
                this.$el.append(projectView.render().el)
            }
        })
    };

    GitPull.data = {
        projects: new GitPull.collections.Projects()
    };

    GitPull.init = function() {
        //Handlebars.registerPartial('pull', $("#pull-partial").html());
        //this.handlebars['project'] = Handlebars.compile($("#project-template").html());
        //this.handlebars['pull'] = Handlebars.registerPartial('pull', $("#pull-partial").html());
    };

    GitPull.loadProjectsFrom = function(pullJson) {
        var projects = GitPull.data.projects;
        for (var key in pullJson) {
            if (pullJson.hasOwnProperty(key)) {
                var list = pullJson[key];

                var project = new GitPull.models.Project({ name:key, projectId:key })

                _.each(list, function(pullRequest) {
                    project.get('pullRequests').add(pullRequest);
                }, this);

                if (project.get('pullRequests').length > 0) {
                    projects.add(project);
                }
            }
        }
    };

}(this.GitPull));


$(document).ready(function () {
    GitPull.init();

    var timeout;

    function getPullRequests() {
        //clearTimeout(timeout);
        //timeout = setTimeout(getPullRequests, 60000 * 5);

        $.ajax({
            type: "GET",
            url: "/git/pulls",
            dataType: "json",
            data: {}
        }).done(function (json) {
            GitPull.loadProjectsFrom(json);
            $('#loadingMessage').fadeOut(200, function () {
                var projectsView = new GitPull.views.Projects({ collection: GitPull.data.projects });
                $('#content').html(projectsView.render().el)
            });
        });
    }

    getPullRequests();
});