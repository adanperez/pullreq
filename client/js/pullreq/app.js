var Pullreq = Pullreq || {};

(function() {

    Pullreq.globalEvents = _.extend({}, Backbone.Events);;

    Pullreq.VERSION = "0.4.0";

    Pullreq.models  = {

        PullRequest: Backbone.Model.extend({
            defaults: {
                isExtraInfoLoaded: false,
                isWarning: false,
                isGood: false,
                // Shared array of warning files between objects
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
                    url: '/api/pullRequests/' + this.get('base').repo.owner.login + '/' + this.get('base').repo.name + '/' + this.get('number') + '/info',
                    dataType: 'json',
                    data: {}
                }).done(function (json) {
                        pullRequestModel.addExtraInfo(json)
                        pullRequestModel.trigger('extraInfoLoaded', pullRequestModel);
                        Pullreq.globalEvents.trigger('pullRequest:extraInfoLoaded', pullRequestModel);
                    });
            },
            addExtraInfo: function(json) {
                var pullRequestModel = this;
                _.each(json, function(value, attr) {
                    pullRequestModel.set(attr, value);
                });
                pullRequestModel.set('isExtraInfoLoaded', true);
                pullRequestModel.set('isWarning', this.containsWarningFiles(Pullreq.data.collections.warningPaths));
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
            containsWarningFiles: function(warningFilesCollection) {
                var files = this.get('files');
                var found = false;
                if (files && warningFilesCollection) {
                    _.each(files, function(file) {
                        file.isWarn = warningFilesCollection.some(function(path) {
                            return file.filename.indexOf(path.get('path')) !== -1;
                        });
                        found = found || file.isWarn;
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

        UserRepo: Backbone.Model.extend({}),

        WarningPath: Backbone.Model.extend({
            defaults: {
                path:null
            },
            idAttribute: '_id'
        }),

        TeamTag: Backbone.Model.extend({
            defaults: {
                'class':'tag'
            }
        }),

        Project: Backbone.Model.extend({
            idAttribute: 'id',
            initialize: function() {
                var pulls = new Pullreq.collections.PullRequests();
                pulls.on('extraInfoLoaded', this.determineIfProjectIsReady, this)
                this.set('pullRequests', pulls);
            },
            determineIfProjectIsReady: function(e) {
                var pulls = this.get('pullRequests');
                //var anyModdedPulls = false;
                var res = pulls.every(function(pull) {
                    //anyModdedPulls = (pull.get('isWarning') ||  pull.get('isGood')) ? true : anyModdedPulls;
                    return pull.get('isExtraInfoLoaded');
                });
                if (res) {
                    this.trigger('projectReload', this);
                }
            }
        })
    };

    Pullreq.collections  = {

        TeamTags: Backbone.Collection.extend({
            model: Pullreq.models.TeamTag,
            comparator: function(model) {
                return model.get('name');
            }
        }),

        RepoOptions: Backbone.Collection.extend({
            url: '/api/repoOptions',
            model: Pullreq.models.RepoOwner
        }),

        UserRepos: Backbone.Collection.extend({
            url: '/api/userRepos',
            model: Pullreq.models.UserRepo
        }),

        WarningPaths: Backbone.Collection.extend({
            url: '/api/warningPaths',
            model: Pullreq.models.WarningPath
        }),

        Projects: Backbone.Collection.extend({
            model: Pullreq.models.Project,
            comparator: function(model) {
                return model.get('name');
            }
        }),

        PullRequests: Backbone.Collection.extend({
            model: Pullreq.models.PullRequest,
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

    Pullreq.views  = {

        utils: {
            initializeFixedMenu: function(adjustment) {
                var top = $('#menu').parent().offset().top - 10 - (adjustment ? adjustment : 0);  // -10 for fixed style
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
            //el: $("#owners"),
            idAttribute: 'repoOwners',
            events: {
                'click input.repoOption': 'repoOptionClick',
                'click button.saveLink': 'saveRepos'
            },
            data: {
                successMessage: '<div class="alert alert-success">' +
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                    '<strong>Bravo!</strong> You have successfully saved your warning paths.' +
                    '</div>',
                warningMessage: '<div class="alert alert-error">' +
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                    '<strong>Error!</strong> Something didn\'t save correctly.' +
                    '</div>'
            },
            repoOwnerTemplate: Handlebars.compile($("#repo-owner-template").html()),
            template: Handlebars.compile($("#repo-options-template").html()),

            initialize: function () {
                this.options.loadCount = 0;
                this.options.repoOptionsCollection.bind("reset", this.initialLoad, this);
                this.options.userReposCollection.bind("reset", this.initialLoad, this);
            },
            initialLoad: function() {
                this.options.loadCount++;
                if (this.options.loadCount > 1) {
                    this.renderRepos();
                }
            },

            saveRepos: function(e) {
                e.preventDefault();
                var view = this;
                var form = view.$el.find('form');
                form.find('.alert').remove();
                Backbone.sync('create', this.options.userReposCollection, {
                    success: function() {
                        form.prepend(view.data.successMessage);
                    },
                    error:function() {
                        form.prepend(view.data.warningMessage);
                    }
                });
            },

            removeView: function() {
                this.options.repoOptionsCollection.unbind();
                this.options.userReposCollection.unbind();
                this.remove();
            },

            repoOptionClick: function(e){
                var name = $(e.currentTarget).val().split('/');
                var owner = name[0];
                var repo = name[1];
                if (e.currentTarget.checked) {
                    this.options.userReposCollection.add([{owner:owner, repo:repo}]);
                } else {
                    var userRepo = this.options.userReposCollection.find(function(userRepo) {
                        return userRepo.get('owner') == owner && userRepo.get('repo') == repo;
                    });
                    this.options.userReposCollection.remove(userRepo);
                }
            },

            render: function() {
                this.$el.html(this.template());
                return this;
            },
            renderRepos: function() {
                var view = this;
                this.$el.fadeOut(100, function() {
                    $('#loadingMessage h1', view.$el).html('Choose your repos');
                    $('#owners', view.$el).empty();
                    view.options.repoOptionsCollection.each(view.makeView, view);
                    view.$el.fadeIn(200, function() {
                        $('#buttons').show();
                    });
                });
            },
            makeView: function(repo) {
                var json = repo.toJSON();

                _.each(json.repos, function(repo) {
                    repo.isChecked = this.options.userReposCollection.some(function(userRepo) {
                        return repo.owner.login.toLowerCase() == userRepo.get('owner') && repo.name.toLowerCase() == userRepo.get('repo');
                    }, this);
                }, this);
                $('#owners', this.$el).append(this.repoOwnerTemplate(json))
            }
        }),

        WarningPath: Backbone.View.extend({
            tagName: 'li',
            className: 'warningPath',
            events: {
                'click a': 'removePath',
                'mouseenter i': 'viewHover',
                'mouseout i': 'viewHover'
            },
            template: Handlebars.compile($("#warning-path-template").html()),

            initialize: function() {
                this._modelBinder = new Backbone.ModelBinder();
            },
            viewHover: function(e) {
                var icon = $(e.target);
                if (icon.hasClass('icon-remove-sign')) {
                    icon.removeClass('icon-remove-sign').addClass('icon-remove-circle');
                } else {
                    icon.removeClass('icon-remove-circle').addClass('icon-remove-sign');
                }
            },
            removePath: function(e) {
                e.preventDefault();
                this.model.destroy();
                this.remove();
            },
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                this._modelBinder.bind(this.model, this.el);
                return this;
            }
        }),

        WarningPaths: Backbone.View.extend({
            //el: $("#owners"),
            idAttribute: 'warningPaths',
            events: {
                'click button.addLink': 'addNewPath',
                'click button.saveLink': 'savePaths'
            },
            data: {
                pathViews: [],
                successMessage: '<div class="alert alert-success">' +
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                    '<strong>Bravo!</strong> You have successfully saved your warning paths.' +
                    '</div>',
                warningMessage: '<div class="alert alert-error">' +
                    '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
                    '<strong>Error!</strong> Something didn\'t save correctly.' +
                    '</div>'
            },
            template: Handlebars.compile($("#warning-paths-template").html()),
            removeView: function() {
                this.remove();
            },
            initialize: function () {
                this.collection.bind("reset", this.renderPaths, this);
                this.collection.bind("add", this.renderNewPath, this);
                //this.collection.bind("destroy", this.pathRemoved, this);
            },
            savePaths: function(e) {
                e.preventDefault();
                var view = this;
                var form = view.$el.find('form');
                form.find('.alert').remove();
                Backbone.sync('create', this.collection, {
                    success: function() {
                        form.prepend(view.data.successMessage);
                    },
                    error:function() {
                        form.prepend(view.data.warningMessage);
                    }
                });

            },
            addNewPath: function() {
                // Add new warning path
                this.collection.add([{}]);
            },
            renderNewPath: function(newPath) {
                var warningPathView = new Pullreq.views.WarningPath({
                    model: newPath
                });
                this.renderPathView(warningPathView, true);
            },
            render: function() {
                this.$el.html(this.template());
                return this;
            },
            renderPaths: function() {
                var view = this;
                this.$el.fadeOut(200, function() {
                    $('#loadingMessage h1', view.$el).html('Edit your warning paths');
                    $('#warnings', view.$el).empty();
                    view.collection.each(function(pathModel) {
                        var warningPathView = new Pullreq.views.WarningPath({
                            model: pathModel
                        });
                        view.renderPathView(warningPathView);
                    }, view);
                    view.$el.fadeIn(200, function() {
                        $('.buttons').show();
                    });
                });
            },
            renderPathView: function(warningPathView, focus) {
                $('#warnings', this.$el).append(warningPathView.render().el);
                if (focus) {
                    $('#warnings li', this.$el).last().find('input').focus();
                }
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
                //this.model.bind('extraInfoLoaded', this.renderExtraInfo, this);
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

                var body = this.model.get('body');
                if (body && body.indexOf(':warning:') !== -1) {
                    this.$el.find('a.pull-link')
                        .append(' <i class="icon-exclamation-sign" title="This pull request contains a warning note."></i>')
                        .addClass('pull-desc-warn');
                }

                if (this.model.get('isMissingTests')) {
                    var link = this.$el.find('a.pull-link')
                        .append(' <i class="icon-question-sign" title="This pull request is missing tests"></i> ');
                }
                this.$el.find('ul.subInfo').html(this.templates.extraInfo( this.model.toJSON()));
            },
            render: function() {
                this.$el.html(this.templates.pullRequest(this.model.toJSON()));
                this.renderExtraInfo();
                // remove auto wrap div
                //this.$el = this.$el.children();
                //this.setElement(this.$el);

                return this;
            }
        }),

        Project: Backbone.View.extend({

            template: Handlebars.compile($("#project-template").html()),
            className: 'project',
            tagName: 'div',

            data: {
                pullRequestViews: []
            },

            initialize: function() {
                this.model.on('projectReload', this.render, this);
            },

            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                var pullRequests = this.model.get('pullRequests');
                pullRequests.sort();
                var pulls = [];
                pulls = pulls.concat(pullRequests.getGoodPulls());
                pulls = pulls.concat(pullRequests.getWarnPulls());
                pulls = pulls.concat(pullRequests.getNewPulls());
                _.each(pulls, function(pullRequest) {
                    if (!Pullreq.data.tag || _.contains(pullRequest.get('tags'), Pullreq.data.tag)) {
                        var pullView = new Pullreq.views.PullRequest({model:pullRequest});
                        this.data.pullRequestViews.push(pullView);
                        this.$('.pull-requests').append(pullView.render().el);
                    }
                }, this);
                // remove auto wrap div
                //this.$el = this.$el.children();
                //this.setElement(this.$el);
                return this;
            },

            removeView: function() {
                _.each(this.data.pullRequestViews, function(view) {
                    view.remove();
                });
                this.remove();
            }
        }),

        Projects: Backbone.View.extend({

            template: Handlebars.compile($("#project-template").html()),

            initialize: function () {},

            data: {
                projectViews: []
            },

            reset: function() {
                this.data.projectViews = [];
            },

            removeSubViews: function() {
                _.each(this.data.projectViews, function(view) {
                    view.removeView();
                });
                this.reset();
            },

            render: function() {
                var that = this;
                this.$el.fadeOut(150, function() {
                    that.removeSubViews();
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
                var projectView = new Pullreq.views.Project({model:project});
                this.data.projectViews.push(projectView);
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
                Pullreq.globalEvents.trigger('tag:selected', $(e.target).data('tag'));
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
                    this.renderTag({'class':'tags', name:'ALL', value:null, selected: !Pullreq.data.tag ? 'selected':''});
                    var that = this;
                    this.collection.each(function(tag) {
                        var json = tag.toJSON();
                        json.selected = Pullreq.data.tag == tag.get('value') ? 'selected': '';
                        that.renderTag(json);
                    }, this);
                }
                return this;
            },

            renderTag: function(json) {
                this.$el.append(this.template(json));
            }
        }),

        OptionsMenu: Backbone.View.extend({
            events: {
                'click a': 'selectMenuItem'
            },
            selectMenuItem: function (e) {
                $('li', this.$el).removeClass('selected');
                $(e.target).parents('li').addClass('selected');
            },
            initialSelect: function(path) {
                this.$el.find('li').each(function() {
                    var link = $('a', this).attr('href');
                    if(link.indexOf(path) !== -1) {
                        $(this).addClass('selected');
                    }
                });
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
                progressBarPercent: 0,
                initialLoadCount:0,
                isViewLoaded: false,
                isLoading: true
            },

            initialize: function() {
                Pullreq.views.utils.initializeFixedMenu(95); // 95 px for progress bar
                Pullreq.data.collections.pullRequests = new Pullreq.collections.PullRequests();
                Pullreq.data.collections.teamTags = new Pullreq.collections.TeamTags();
                Pullreq.data.collections.warningPaths = new Pullreq.collections.WarningPaths();
                Pullreq.data.collections.warningPaths.on('error', this.defaultErrorHandler, this);
                Pullreq.data.collections.pullRequests.on('error', this.defaultErrorHandler, this);
                Pullreq.data.collections.pullRequests.on('reset', this.initialLoad, this);
                Pullreq.data.collections.warningPaths.once('reset', this.initialLoad, this);
                Pullreq.globalEvents.on('pullRequest:extraInfoLoaded', this.progressBarUpdateCompleteStatus, this);
                Pullreq.globalEvents.on('tag:selected', this.updateTag, this);
                this.updateProgressBar(10);
                Pullreq.data.collections.warningPaths.fetch({reset:true});
                Pullreq.data.collections.pullRequests.fetch({reset:true});
            },

            defaultErrorHandler: function(model, error) {
                if (error.status == 401 || error.status == 403) {
                    window.location = '/'; // not logged in
                }
            },

            initialLoad: function() {
                this.updateProgressBar(this.data.progressBarPercent + 20);
                this.data.initialLoadCount++;
                if (this.data.initialLoadCount > 1) {
                    this.collectionLoaded();
                }
            },

            refreshPage: function(e) {
                e.preventDefault();
                if (!this.data.isLoading) {
                    this.data.isLoading = true;
                    this.progressBarBegin();
                    Pullreq.data.collections.pullRequests.fetch({reset:true});
                }
            },

            updateProgressBar: function(percent) {
                this.data.progressBarPercent = percent;
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
                this.updateProgressBar(30);
                $('#loadingMessage').slideDown(120);
                $('#userOptions').fadeIn(100);
                this.data.progressBarCount = 0;
                this.data.progressBarComplete = 0;
            },

            collectionLoaded: function() {
                this.data.progressBarCount = Pullreq.data.collections.pullRequests.length;
                if (Pullreq.data.collections.pullRequests.isEmpty()) {
                    this.progressBarComplete();
                } else {
                    //this.updateProgressBar(this.data.progressBarPercent + 20);
                    this.makeTeamTags();
                    Pullreq.data.collections.teamTags.sort();
                }

                // Only load tag view once
                if (!this.data.isViewLoaded) {
                    this.render();
                    this.data.isViewLoaded = true;
                }
                Pullreq.data.views.tags.updateView();
                this.updateViewForTag();
                this.data.isLoading = false;
            },

            makeTeamTags: function() {
                var re = /^([A-Za-z]+)\-?(\d+)?.*$/i;
                Pullreq.data.collections.pullRequests.each(function(pullRequest) {
                    var title = pullRequest.get('title');
                    var res = title.match(re);
                    if (res) {
                        var tagName = res[1].toUpperCase();

                        // Update tags if new tag came in
                        var tag = Pullreq.data.collections.teamTags.find(function(e) {
                            return e.get('name') == tagName;
                        });
                        if (!tag) {
                            Pullreq.data.collections.teamTags.add({name:tagName, value:tagName});
                        }
                        pullRequest.get('tags').push(tagName);
                    }
                }, this);
            },

            makeProjectsForTag: function() {
                var projects = {};
                Pullreq.data.collections.pullRequests.each(function(pull) {
                    if (Pullreq.data.tag && !_.contains(pull.get('tags'), Pullreq.data.tag)) {
                        return;
                    }
                    var name = pull.get('base').repo.owner.login + '/' + pull.get('base').repo.name;
                    var project = projects[name];
                    if (!projects[name]) {
                        project = new Pullreq.models.Project({name:name});
                        projects[name] = project;
                    }
                    project.get('pullRequests').add(pull);
                }, this);
                projects = _.map(projects, function(num, key) { return num; });
                projects = new Pullreq.collections.Projects(projects);
                return projects;
            },

            updateTag: function(tag) {
                Pullreq.data.tag = tag;
                this.updateViewForTag();
            },

            updateViewForTag: function() {
                Pullreq.data.views.projects.collection = this.makeProjectsForTag();
                Pullreq.data.views.projects.render();
            },

            render: function() {
                Pullreq.data.views.projects = new Pullreq.views.Projects({
                    el: $("#projects")
                });
                Pullreq.data.views.tags = new Pullreq.views.TeamTags({
                    el: $("#teamTags"),
                    collection: Pullreq.data.collections.teamTags
                });
                Pullreq.data.views.tags.render();
                this.$el.find('#menu').show();
            }
        })
    };

    Pullreq.routes = {
        OptionsApp: Backbone.Router.extend({
            routes: {
                'warningPaths': 'warningPathsView',
                '*repos': 'reposView'
            },
            initialize: function() {
                Pullreq.views.utils.initializeFixedMenu();
                Pullreq.data.collections.userRepos = new Pullreq.collections.UserRepos();
                Pullreq.data.collections.repoOptions = new Pullreq.collections.RepoOptions();
                Pullreq.data.collections.warningPaths = new Pullreq.collections.WarningPaths();
                // handle errors
                Pullreq.data.collections.userRepos.on('error', this.defaultErrorHandler, this);
                Pullreq.data.collections.repoOptions.on('error', this.defaultErrorHandler, this);
                Pullreq.data.collections.warningPaths.on('error', this.defaultErrorHandler, this);
                // load menu
                Pullreq.data.views.optionsMenu = new Pullreq.views.OptionsMenu({
                    el: $('#optionMenu')
                });

                if (!window.location.hash) {
                    window.location.hash = "/repos";
                }

                Backbone.history.start();
                Pullreq.data.views.optionsMenu.initialSelect(Backbone.history.fragment);
            },
            defaultErrorHandler: function(model, error) {
                if (error.status == 401 || error.status == 403) {
                    window.location = '/'; // not logged in
                }
            },
            removeView: function() {
                if (Pullreq.data.views.options) {
                    Pullreq.data.views.options.removeView();
                }
            },
            reposView: function() {
                this.removeView();
                Pullreq.data.views.options = new Pullreq.views.RepoOwners({
                    userReposCollection: Pullreq.data.collections.userRepos,
                    repoOptionsCollection: Pullreq.data.collections.repoOptions
                });
                $('#content').html(Pullreq.data.views.options.render().el);
                Pullreq.data.collections.userRepos.fetch({reset:true});
                Pullreq.data.collections.repoOptions.fetch({reset:true});
            },
            warningPathsView: function() {
                this.removeView();
                Pullreq.data.views.options = new Pullreq.views.WarningPaths({
                    collection: Pullreq.data.collections.warningPaths
                });
                $('#content').html(Pullreq.data.views.options.render().el);
                Pullreq.data.collections.warningPaths.fetch({reset:true});
            }
        })
    };

    Pullreq.data = {
        views: {},
        collections: {},
        models: {},
        tag: null
    };

}());
