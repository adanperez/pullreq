var PullReq = PullReq || {};

(function() {

    PullReq.globalEvents = _.extend({}, Backbone.Events);;

    PullReq.VERSION = "0.3.0";

    PullReq.models  = {

        PullRequest: Backbone.Model.extend({
            defaults: {
                isExtraInfoLoaded: false,
                isWarning: false,
                isGood: false,
                // Shared array of warning files between objects
                warningPaths: ['grails-app/migrations', 'grails-app/conf', 'releaseNotes'],
                testPaths: ['test/']
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
                    pullRequestModel.trigger('extraInfoLoaded', pullRequestModel);
                    PullReq.globalEvents.trigger('pullRequest:extraInfoLoaded', pullRequestModel);
                });
            },
            addExtraInfo: function(json) {
                var pullRequestModel = this;
                _.each(json, function(value, attr) {
                    pullRequestModel.set(attr, value);
                });
                pullRequestModel.set('isExtraInfoLoaded', true);
                pullRequestModel.set('isWarning', this.containsWarningFiles());
                pullRequestModel.set('isGood', this.isPullRequestGood());
                pullRequestModel.set('isMissingTests', !this.areThereTestsFiles());
            },
            isPullRequestGood: function() {
                var comments = this.get('issueComments');
                if (comments) {
                    var count = 0;
                    _.each(comments, function(comment) {
                        if (comment.body.indexOf('+1') !== -1) {
                            count++;
                        }
                    });
                    return count > 1;
                }
            },
            containsWarningFiles: function() {
                var files = this.get('files');
                var found = false;
                if (files) {
                    var warningPaths = this.get('warningPaths');
                    found = files.some(function(file) {
                        file.isWarn = warningPaths.some(function(path) {
                            return file.filename.indexOf(path) !== -1;
                        });
                        return file.isWarn;
                    });
                }
                return found;
            },
            areThereTestsFiles: function() {
                var files = this.get('files');
                var found = false;
                if (files) {
                    var testPaths = this.get('testPaths');
                    var found = false;
                    files.every(function(file) {
                        testPaths.every(function(path) {
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

        TeamTag: Backbone.Model.extend({
            defaults: {
                'class':'tag'
            }
        }),

        Project: Backbone.Model.extend({
            idAttribute: 'id',
            initialize: function() {
                var pulls = new PullReq.collections.PullRequests();
                pulls.on('extraInfoLoaded', this.determineIfProjectIsReady, this)
                this.set('pullRequests', pulls);
            },
            determineIfProjectIsReady: function(e) {
                var pulls = this.get('pullRequests');
                var anyModdedPulls = false;
                var res = pulls.every(function(pull) {
                    anyModdedPulls = (pull.get('isWarning') ||  pull.get('isGood')) ? true : anyModdedPulls;
                    return pull.get('isExtraInfoLoaded');
                });
                if (res) {
                    this.trigger('projectReload', this);
                }
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
            model: PullReq.models.Project,
            comparator: function(model) {
                return model.get('name');
            }
        }),

        PullRequests: Backbone.Collection.extend({
            model: PullReq.models.PullRequest,
            url: '/api/pullRequests',
            initialize: function() {
                var that = this;
                this.on('reset', function(e) {
                    that.fetchExtraInfo();
                });
            },
            fetchExtraInfo: function() {
                this.each(function(pull) {
                    pull.fetchExtraInfo();
                }, this);
            },
            comparator: function(model) {
                return model.get('title').toLowerCase();
            },
            getGoodPulls: function() {
                var pulls = [];
                this.each(function(pull) {
                    if (pull.get('isGood')) pulls.push(pull);
                }, this);
                return pulls;
            },
            getWarnPulls: function() {
                var pulls = [];
                this.each(function(pull) {
                    if (pull.get('isWarning') && !pull.get('isGood')) pulls.push(pull);
                }, this);
                return pulls;
            },
            getNewPulls: function() {
                var pulls = [];
                this.each(function(pull) {
                    if (!pull.get('isWarning') && !pull.get('isGood')) pulls.push(pull);
                }, this);
                return pulls;
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
                'click a.descriptionLink': 'toggleSummary',
                'click a.filesLink': 'renderFilesModal'
            },

            templates: {
                pullRequest: Handlebars.compile($("#pull-template").html()),
                extraInfo: Handlebars.compile($("#pull-request-extra-info-template").html()),
                pullComment: Handlebars.compile($("#pull-request-comment-template").html()),
                filesModal: Handlebars.compile($("#files-template").html())
            },

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
                var filesModal = this.templates.filesModal(this.model.toJSON()).trim(); // bug with jQuery if leading whitespace.
                $(filesModal).modal({
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
                        el.append(that.templates.pullComment(comment));
                    });
                }
            },
            renderExtraInfo: function() {
                if (this.model.get('isGood')) {
                    this.$el.find('a.pull-link')
                        .prepend('<i class="icon-thumbs-up"></i> ')
                        .addClass('pull-good');
                }

                if (this.model.get('isWarning')) {
                    var link = this.$el.find('a.pull-link')
                        .prepend('<i class="icon-warning-sign"></i> ')
                        .addClass('pull-warn');
                }

                if (this.model.get('isMissingTests')) {
                    var link = this.$el.find('a.pull-link')
                        .append(' <i class="icon-question-sign" title="This pull request is missing tests" alt="This pull request is missing tests"></i> ');
                }
                this.$el.find('ul.subInfo').html(this.templates.extraInfo( this.model.toJSON()));
            },
            render: function() {
                this.$el.html(this.templates.pullRequest(this.model.toJSON()));
                this.renderExtraInfo();
                // remove auto wrap div
                this.$el = this.$el.children();
                this.setElement(this.$el);

                return this;
            }
        }),

        Project: Backbone.View.extend({
            template: Handlebars.compile($("#project-template").html()),
            initialize: function() {
                this.model.on('projectReload', this.render, this);
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                var pullRequests = this.model.get('pullRequests');
                pullRequests.sort();
                _.each(pullRequests.getGoodPulls(), function(pullRequest) {
                    if (!PullReq.data.tag || _.contains(pullRequest.get('tags'), PullReq.data.tag)) {
                        var pullView = new PullReq.views.PullRequest({model:pullRequest});
                        this.$('.pull-requests').append(pullView.render().el);
                    }
                }, this);
                _.each(pullRequests.getWarnPulls(), function(pullRequest) {
                    if (!PullReq.data.tag || _.contains(pullRequest.get('tags'), PullReq.data.tag)) {
                        var pullView = new PullReq.views.PullRequest({model:pullRequest});
                        this.$('.pull-requests').append(pullView.render().el);
                    }
                }, this);
                _.each(pullRequests.getNewPulls(), function(pullRequest) {
                    if (!PullReq.data.tag || _.contains(pullRequest.get('tags'), PullReq.data.tag)) {
                        var pullView = new PullReq.views.PullRequest({model:pullRequest});
                        this.$('.pull-requests').append(pullView.render().el);
                    }
                }, this);
                // remove auto wrap div
                this.$el = this.$el.children();
                this.setElement(this.$el);
                return this;
            }
        }),

        Projects: Backbone.View.extend({

            template: Handlebars.compile($("#project-template").html()),

            initialize: function () {},

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
                var projectView = new PullReq.views.Project({model:project});
                this.$el.append(projectView.render().el);
            }
        }),

        TeamTags: Backbone.View.extend({

            template: Handlebars.compile('<li class="{{selected}}"><i class="icon-{{class}}"></i> <a href="#" data-tag="{{value}}">{{name}}</a></li>'),

            events: {
                'click a': 'filterTag'
            },

            filterTag: function(e) {
                e.preventDefault();
                $('li', this.$el).removeClass('selected');
                $(e.target).parents('li').addClass('selected');
                PullReq.globalEvents.trigger('tag:selected', $(e.target).data('tag'));
            },

            initialize: function () {},

            updateView: function() {
                this.render();
            },

            render: function() {
                this.$el.empty();
                if (this.collection.isEmpty()) {
                    this.$el.hide();
                } else {
                    this.renderTag({'class':'tags', name:'ALL', value:null, selected: !PullReq.data.tag ? 'selected':''});
                    var that = this;
                    this.collection.each(function(tag) {
                        var json = tag.toJSON();
                        json.selected = PullReq.data.tag == tag.get('value') ? 'selected': '';
                        that.renderTag(json);
                    }, this);
                }
                return this;
            },

            renderTag: function(json) {
                this.$el.append(this.template(json));
            }
        }),

        MainApp: Backbone.View.extend({
            el: $('#main'),

            events: {
                'click #refreshLink': 'refreshPage'
            },

            data: {
                progressBarCount: 0,
                progressBarComplete: 0,
                isViewLoaded: false
            },

            initialize: function() {
                PullReq.views.utils.initializeFixedMenu(95); // 95 px for progress bar
                PullReq.data.collections.pullRequests = new PullReq.collections.PullRequests();
                PullReq.data.collections.teamTags = new PullReq.collections.TeamTags();
                PullReq.data.collections.pullRequests.on('reset', this.collectionLoaded, this);
                PullReq.globalEvents.on('pullRequest:extraInfoLoaded', this.progressBarUpdateCompleteStatus, this);
                PullReq.globalEvents.on('tag:selected', this.updateTag, this);

                this.updateTag(null);
            },

            refreshPage: function() {
                this.updateTag(PullReq.data.tag);
            },

            updateProgressBar: function(percent) {
                $('#progressBar div').width(percent+'%');
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
                $('#loadingMessage').slideUp(120, function() {
                    $('#loadingMessage h1').hide();
                });
                $('#userOptions').fadeIn(100);
            },

            progressBarBegin: function() {
                this.updateProgressBar(25);
                $('#loadingMessage').slideDown(120);
                $('#userOptions').fadeIn(100);
                this.data.progressBarCount = 0;
                this.data.progressBarComplete = 0;
            },

            collectionLoaded: function() {
                this.data.progressBarCount = PullReq.data.collections.pullRequests.length;
                if (PullReq.data.collections.pullRequests.isEmpty()) {
                    this.progressBarComplete();
                } else {
                    this.updateProgressBar(50);
                    this.makeTeamTags();
                    PullReq.data.collections.teamTags.sort();
                }

                // Only load tag view once
                if (!this.data.isViewLoaded) {
                    this.render();
                    this.data.isViewLoaded = true;
                }
                this.updateViewForTag();
            },

            makeTeamTags: function() {
                var re = /^([A-Za-z]+)\-?(\d+)?.*$/i;
                PullReq.data.collections.pullRequests.each(function(pullRequest) {
                    var title = pullRequest.get('title');
                    var res = title.match(re);
                    if (res) {
                        var tagName = res[1].toUpperCase();

                        // Update tags if new tag came in
                        var tag = PullReq.data.collections.teamTags.find(function(e) {
                            return e.get('name') == tagName;
                        });
                        if (!tag) {
                            PullReq.data.collections.teamTags.add({name:tagName, value:tagName});
                        }
                        pullRequest.get('tags').push(tagName);
                    }
                }, this);
            },

            makeProjectsForTag: function() {
                var projects = {};
                PullReq.data.collections.pullRequests.each(function(pull) {
                    if (PullReq.data.tag && !_.contains(pull.get('tags'), PullReq.data.tag)) {
                        return;
                    }
                    var name = pull.get('base').repo.owner.login + '/' + pull.get('base').repo.name;
                    var project = projects[name];
                    if (!projects[name]) {
                        project = new PullReq.models.Project({name:name});
                        projects[name] = project;
                    }
                    project.get('pullRequests').add(pull);
                }, this);
                projects = _.map(projects, function(num, key) { return num; });
                projects = new PullReq.collections.Projects(projects);
                return projects;
            },

            updateTag: function(tag) {
                PullReq.data.tag = tag;
                this.progressBarBegin();
                PullReq.data.collections.pullRequests.fetch();
            },

            updateViewForTag: function() {
                PullReq.data.views.projects = new PullReq.views.Projects({
                    el: $("#projects"),
                    collection: this.makeProjectsForTag()
                });
                PullReq.data.views.tags.updateView()
                PullReq.data.views.projects.render();
            },

            render: function() {
                PullReq.data.views.tags = new PullReq.views.TeamTags({
                    el: $("#teamTags"),
                    collection: PullReq.data.collections.teamTags
                });
                PullReq.data.views.tags.render();
                this.$el.find('#menu').show();
            }
        })
    };

    PullReq.data = {
        views: {},
        collections: {},
        models: {},
        tag: null
    };

}());
