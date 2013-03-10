
var PullReq = PullReq || {};

(function() {

    PullReq.globalEvents = _.extend({}, Backbone.Events);;

    PullReq.VERSION = "0.2.0";

    PullReq.models  = {

        PullRequest: Backbone.Model.extend({
            defaults: {
                warningPaths: ['grails-app/migrations', 'grails-app/conf', 'releaseNotes']
            },
            initialize: function() {
                if( !this.get('tags') ){
                    this.set({tags: new Array()});
                }
            },
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
                    PullReq.globalEvents.trigger('pullRequest:extraInfoLoaded', this);
                });
            },
            addExtraInfo: function(json) {
                var pullRequestModel = this;
                _.each(json, function(value, attr) {
                    pullRequestModel.set(attr, value);
                });
                pullRequestModel.set('extraInfoLoaded', true);
            },
            containsWarningFiles: function() {
                var files = this.get('files');
                var found = false;
                if (files) {
                    var warningPaths = this.get('warningPaths');
                    var found = false;
                    files.every(function(file) {
                        warningPaths.every(function(path) {
                            found = file.filename.indexOf(path) !== -1;
                            return !found;
                        });
                        return !found;
                    });
                }
                return found;
            }
        }),

        User: Backbone.Model.extend({}),

        RepoOwner: Backbone.Model.extend({}),

        TeamTag: Backbone.Model.extend({}),

        Project: Backbone.Model.extend({
            defaults: {
                name:''
            },
            validate: function(attrs) {
                if (attrs.name == undefined || attrs.name == null) {
                    return 'Name cannot be null';
                }
            },
            initialize: function() {
                if( !this.get('tags') ){
                    this.set({tags: new Array()});
                }
                this.set('pullRequests', new PullReq.collections.PullRequests());
                //this.get('pullRequests')
            },
            addPullRequestsFromJSON: function(pullRequestsFromJson) {
                var pullRequests = this.get('pullRequests');
                _.each(pullRequestsFromJson, function(pullRequest) {
                    var pull = new PullReq.models.PullRequest(pullRequest);
                    pullRequests.add(pull);
                    pull.fetchExtraInfo();
                });
            }
        })
    };

    PullReq.collections  = {

        TeamTags: Backbone.Collection.extend({
            model: PullReq.models.TeamTag,
            comparator: function(model) {
                return model.get('name');
            }
        }),

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

        utils: {
           initializeFixedMenu: function(adjustment) {
               var top = $('#menu').parent().offset().top - (adjustment ? adjustment : 0);
               $(window).bind('scroll', function() {
                   var y = $(this).scrollTop();
                   if (y >= top) {
                       $('#menu').addClass('fixed');
                   } else {
                       $('#menu').removeClass('fixed');
                   }
               });
           }
        },

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
                        $('#menu').show();
                    });
                });
                return this;
            },
            makeView: function(repo) {
                this.$el.append(this.template(repo.toJSON()))
            },
            initialize: function () {
                PullReq.views.utils.initializeFixedMenu();
                this.collection = new PullReq.collections.RepoOwners();
                this.collection.bind("reset", this.render, this);
                this.collection.fetch();
            }
        }),

        PullRequest: Backbone.View.extend({
            events: {
                //'mouseenter div.pull-request': 'showDescriptionLink',
                //'mouseleave div.pull-request': 'hideDescriptionLink',
                'click a.descriptionLink': 'toggleSummary',
                'click a.filesLink': 'renderFilesModal'
            },
            template: Handlebars.compile($("#pull-template").html()),
            templateExtraInfo: Handlebars.compile($("#pull-request-extra-info-template").html()),
            templatePullComment: Handlebars.compile($("#pull-request-comment-template").html()),
            templateFiles: Handlebars.compile($("#files-template").html()),

            initialize: function() {
                this.model.bind('extraInfoLoaded', this.renderExtraInfo, this);
            },
            toggleSummary: function(e) {
                e.preventDefault();
                var summary = this.$el.find('div.pull-info');
                if (summary.is(':visible')) {
                    var that = this;
                    summary.slideUp(200, function() {
                        that.$el.find('ul.pull-comments').empty();
                        that.$el.find('a.descriptionLink').html('More Info...');
                    });
                } else {
                    this.renderComments();
                    summary.slideDown(200);
                    this.$el.find('a.descriptionLink').html('Less Info...');
                }
            },
            renderFilesModal: function(e) {
                e.preventDefault();
                var thing = this.templateFiles(this.model.toJSON());
                $(thing.trim()).modal({
                    backdrop: true,
                    keyboard: true
                }).css({
                        'width': function () {
                            return ($(document).width() * .6) + 'px';
                        },
                        'margin-left': function () {
                            return -($(this).width() / 2);
                        }
                    });
            },
            renderComments: function() {
                var el = this.$el.find('ul.pull-comments');
                var comments = this.model.get('issueComments');
                if (comments) {
                    var that = this;
                    _.each(comments, function(comment) {
                        el.append(that.templatePullComment(comment));
                    });
                }
            },
            renderTitleIcons: function() {
                var body = this.model.get('body');
                if (body && body.indexOf(':warning:') !== -1) {
                    //this.$el.find('a.pull-link').prepend('<i class="icon-warning-sign"></i> ');
                }
            },
            renderExtraInfo: function() {
                var comments = this.model.get('issueComments');
                if (comments) {
                    var count = 0;
                    _.each(comments, function(comment) {
                        if (comment.body.indexOf('+1') !== -1) {
                            count++;
                        }
                    });
                    if (count > 1) {
                        this.$el.find('a.pull-link')
                            .prepend('<i class="icon-thumbs-up"></i> ')
                            .addClass('pull-good');
                    }
                }

                if (this.model.containsWarningFiles()) {
                    var link = this.$el.find('a.pull-link')
                        .prepend(' <i class="icon-warning-sign"></i> ')
                        .addClass('pull-warn');
                }
                this.$el.find('ul.subInfo').html(this.templateExtraInfo( this.model.toJSON()));
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                this.renderTitleIcons();
                this.renderExtraInfo();
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
                this.$el.html(this.template(this.model.toJSON()));
                var pullRequests = this.model.get('pullRequests');
                pullRequests.sort();
                pullRequests.each(function(pullRequest) {
                    if (_.contains(pullRequest.get('tags'), PullReq.data.tag)) {
                        var pullView = new PullReq.views.PullRequest({model:pullRequest});
                        this.$('.pull-requests').append(pullView.render().el);
                    }
                }, this);
                return this;
            }
        }),

        Projects: Backbone.View.extend({

            template: Handlebars.compile($("#project-template").html()),

            initialize: function () {
            },

            render: function() {
                var that = this;
                this.$el.fadeOut(150, function() {
                    that.$el.empty();
                    if (that.collection.isEmpty()) {
                        that.$el.html('<div class="noPullRequests"><h2>There are no open pull requests</h2></div>');
                    } else {
                        that.collection.each(that.addProjectView, that);
                    }
                    that.$el.fadeIn(150);
                });
                return this;
            },

            addProjectView: function(project) {
                if (_.contains(project.get('tags'), PullReq.data.tag)) {
                    var projectView = new PullReq.views.Project({model:project});
                    this.$el.append(projectView.render().el);
                }
            }
        }),

        TeamTags: Backbone.View.extend({

            template: Handlebars.compile($("#tag-item-template").html()),

            events: {
                'click a': 'filterTag'
            },

            filterTag: function(e) {
                e.preventDefault();
                var tags = $(e.target).parents('#teamTags')[0];
                $('li', tags).removeClass('selected');
                $(e.target).parents('li').addClass('selected');
                PullReq.globalEvents.trigger('tag:selected', $(e.target).html());
            },

            initialize: function () {},

            render: function() {
                this.collection.each(this.renderTag, this);
                return this;
            },

            renderTag: function(tag) {
                this.$el.append(this.template(tag.toJSON()));
            }
        }),

        MainApp: Backbone.View.extend({
            el: $('#main'),

            data: {
                progressBarCount: 0,
                progressBarComplete: 0
            },

            initialize: function() {
                PullReq.views.utils.initializeFixedMenu(95); // 95 px for progress bar
                this.data.teamTags = new PullReq.collections.TeamTags();
                this.data.projects = new PullReq.collections.Projects();
                this.data.projects.bind("reset", this.collectionLoaded, this);
                this.data.projects.bind('addedPullRequests', this.progressBarUpdateInitialCount, this);
                PullReq.globalEvents.on('pullRequest:extraInfoLoaded', this.progressBarUpdateCompleteStatus, this);
                PullReq.globalEvents.on('tag:selected', this.updateViewForTag, this);
                this.data.projects.fetch();
            },

            updateProgressBar: function(percent) {
                $('#progressBar div').width(percent+'%');
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
                    this.progressBarComplete();
                }
            },

            progressBarComplete: function() {
                this.updateProgressBar(100);
                $('#loadingMessage').slideUp(100);
                $('#userOptions').fadeIn(100);
            },

            collectionLoaded: function() {
                if (this.data.projects.isEmpty()) {
                    this.progressBarComplete();
                } else {
                    this.updateProgressBar(50);
                    this.makeTeamTags();
                    this.data.teamTags.sort();
                    this.data.projects.sort();
                }
                this.render();
            },

            makeTeamTags: function() {
                var re = /^([A-Za-z]+)\-?(\d+)?.*$/i;
                this.data.projects.each(function(project) {
                    var tags = project.get('tags');
                    tags.push('ALL');
                    var pullRequests = project.get('pullRequests');
                    pullRequests.each(function(pullRequest) {
                        var title = pullRequest.get('title');
                        var res = title.match(re);
                        if (res) {
                            var tagName = res[1].toUpperCase();
                            var tag = this.data.teamTags.find(function(e) {
                                return e.get('name') == tagName;
                            });
                            if (!tag) {
                                this.data.teamTags.add({name:tagName});
                            }
                            pullRequest.get('tags').push('ALL');
                            pullRequest.get('tags').push(tagName);
                            if (!_.contains(tags, tagName)) {
                                tags.push(tagName);
                            }
                        }
                    }, this);
                }, this);
            },

            updateViewForTag: function(tag) {
                PullReq.data.tag = tag;
                PullReq.data.views.projects.render();
            },

            render: function() {
                PullReq.data.views.projects = new PullReq.views.Projects({
                    el: $("#projects"),
                    collection: this.data.projects
                });
                PullReq.data.views.tags = new PullReq.views.TeamTags({
                    el: $("#teamTags"),
                    collection: this.data.teamTags
                });
                PullReq.data.views.projects.render();
                PullReq.data.views.tags.render();
                this.$el.find('#menu').show();
            }
        })
    };

    PullReq.data = {
        views: {},
        collections: {},
        models: {},
        tag: 'ALL'
    };

}());
