
var PullReq = PullReq || {};

(function(PullReq) {

    PullReq.globalEvents = _.extend({}, Backbone.Events);;

    PullReq.VERSION = "0.1.0";

    PullReq.models  = {
        PullRequest: Backbone.Model.extend({
            fetchExtraInfo: function() {
                var pullRequestModel = this;
                $.ajax({
                    type: 'GET',
                    url: '/api/pullRequestInfo/' + this.get('base').repo.owner.login + '/' + this.get('base').repo.name + '/' + this.get('number'),
                    dataType: 'json',
                    data: {}
                }).done(function (json) {
                    pullRequestModel.addExtraInfo(json)
                    pullRequestModel.trigger('extraInfoLoaded');
                    PullReq.globalEvents.trigger('extraInfoLoaded');
                });
            },
            addExtraInfo: function(json) {
                var pullRequestModel = this;
                _.each(json, function(value, attr) {
                    pullRequestModel.set(attr, value);
                });
            }
        }),

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
                //this.get('pullRequests')
            },
            addPullRequestsFromJSON: function(pullRequestsFromJson) {
                var pullRequests = this.get('pullRequests')
                _.each(pullRequestsFromJson, function(pullRequest) {
                    var pull = new PullReq.models.PullRequest(pullRequest);
                    pullRequests.add(pull);
                    pull.fetchExtraInfo();
                });
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
                var projects = [];
                _.each(data, function(pullRequests, repo) {
                    if (pullRequests.length == 0) {
                        return;
                    }
                    var project = new PullReq.models.Project({
                        name: repo
                    });
                    project.addPullRequestsFromJSON(pullRequests);
                    projects.push(project);
                    this.trigger('addedPullRequests', pullRequests.length);
                }, this);
                return projects;
            },
            comparator: function(model) {
                return model.get('name');
            }
        }),

        PullRequests: Backbone.Collection.extend({
            model: PullReq.models.PullRequest,
            comparator: function(model) {
                return model.get('title').toLowerCase();
            }
        })
    };

    PullReq.views  = {
        RepoOwners: Backbone.View.extend({
            el: $("#owners"),
            template: Handlebars.compile($("#repo-owner-template").html()),
            render: function() {
                var view = this;
                this.$el.fadeOut(100, function() {
                    $('#loadingMessage h1').html('Choose your repos');
                    view.$el.empty();
                    view.collection.each(view.makeView, view);
                    view.$el.fadeIn(200, function() {
                        $('#buttons').show();
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
            events: {
                'mouseenter div.pull-request': 'showDescriptionLink',
                'mouseleave div.pull-request': 'hideDescriptionLink',
                'click a.descriptionLink': 'toggleSummary'
            },
            template: Handlebars.compile($("#pull-template").html()),
            templateExtraInfo: Handlebars.compile($("#pull-request-extra-info-temaplate").html()),

            initialize: function() {
                this.model.bind('extraInfoLoaded', this.renderExtraInfo, this);
            },
            showDescriptionLink: function() {
                var summary = this.$el.find('div.pullSummary');
                if ($.trim(summary.html()).length) {
                    this.$el.find('a.descriptionLink').css('display', 'inline-block');
                }
            },
            toggleSummary: function(e) {
                e.preventDefault();
                var summary = this.$el.find('div.pullSummary');
                if (summary.is(':visible')) {
                    summary.slideUp(200);
                } else {
                    summary.slideDown(200);
                }
                this.$el.find('a.descriptionLink i').toggleClass('icon-double-angle-down');
            },
            hideDescriptionLink: function() {
                this.$el.find('a.descriptionLink').css('display', 'none');
            },
            renderExtraInfo: function() {
                this.$el.find('ul').html(this.templateExtraInfo( this.model.toJSON()));
            },
            render: function() {
                this.$el.html( this.template( this.model.toJSON()));
                return this;
            }
        }),

        Project: Backbone.View.extend({
            template: Handlebars.compile($("#project-template").html()),
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
                var pullRequests = this.model.get('pullRequests');
                pullRequests.sort();
                pullRequests.each(function(pullRequest){
                    var pullView = new PullReq.views.PullRequest({model:pullRequest});
                    this.$('.pull-requests').append(pullView.render().el)
                }, this);
                return this;
            }
        }),

        Projects: Backbone.View.extend({
            el: $("#projects"),

            template: Handlebars.compile($("#project-template").html()),

            data: {
                progressBarCount: 0,
                progressBarComplete: 0
            },

            initialize: function () {
                this.collection = new PullReq.collections.Projects();
                this.collection.bind("reset", this.render, this);
                this.collection.bind("reset", this.loaded, this);
                this.collection.bind('addedPullRequests', this.progressBarUpdateInitialCount, this);
                PullReq.globalEvents.on('extraInfoLoaded', this.progressBarUpdateCompleteStatus, this);
                this.collection.fetch();
            },

            progressBarUpdateInitialCount: function(msg) {
                this.data.progressBarCount += msg;
            },

            progressBarUpdateCompleteStatus: function() {
                this.data.progressBarComplete++;
                var num = this.data.progressBarComplete / this.data.progressBarCount;
                num = num * 50;
                this.updateProgressBar(50 + Math.abs(num));
                if (this.data.progressBarComplete == this.data.progressBarCount) {
                    this.updateProgressBar(100);
                    $('#loadingMessage').slideUp(100);
                    $('#userOptions').fadeIn(100);
                }
            },

            loaded: function() {
                this.updateProgressBar(50);
            },

            updateProgressBar: function(percent) {
                $('#progressBar div').width(percent+'%');
            },

            render: function() {
                this.collection.sort();
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
