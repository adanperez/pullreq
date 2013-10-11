(function() {

    var module = angular.module('pullreq.controllers', [
        'pullreq.service.api',
        'pullreq.service.tags',
        'pullreq.service.pullrequests',
        'lib.lodash'
    ]);

    module.controller('homeController', [
        '$scope',
        '$timeout',
        '_',
        'apiService',
        'tagService',
        'pullRequestService',
        '$rootScope',
        '$location',
        function($scope, $timeout, _, apiService, tagService, pullRequestService, $rootScope, $location) {

            var data = {
                filterByMethod:null,
                filterByValue:null
            };

            $rootScope.$on('display-details', function(message, args) {
                $scope.request = args;
            });

            $scope.$on('$locationChangeStart', function(next, current) {
                if (!$scope.request && current.indexOf('/details') !== -1) {
                    $location.path('/pulls');
                }
            });

            var filter = {
                byUser: function(user) {
                    var pulls = data.pullRequests;
                    if (user != null) {
                        pulls = _.where(pulls, { 'user': {
                            'login': user
                        }});
                        data.filterByMethod = this;
                        data.filterValue = user;
                    }
                    $scope.pullRequests = [];
                    $scope.pullRequests = pulls;
                },
                byTitle: function(tag) {
                    var pulls = data.pullRequests;
                    if (tag != null) {
                        pulls = _.where(pulls, { 'tags': { 'title': tag } });
                        data.filterByMethod = this;
                        data.filterValue = tag;
                    }
                    $scope.pullRequests = [];
                    $scope.pullRequests = pulls;
                },
                byNothing: function() {
                    $scope.pullRequests = data.pullRequests;
                }
            };

            var resetFilter = function() {
                data.filterByMethod = filter.byNothing;
                data.filterByValue = null;
            };

            var filterPullRequests = function() {
                data.filterByMethod(data.filterByValue);
            };

            var handleRepos = function(repos) {
                $scope.progress = 40;
                var count = repos.length;
                var inc = Math.ceil(60/count);

                data.users = pullRequestService.getUsers(repos);
                _.each(repos, function(pull) {
                    apiService.getPullRequestInfo(pull.base.user.login, pull.base.repo.name, pull.number).
                        then(function(eee) {
                            pull.info = eee;
                            $scope.progress += inc;
                            pullRequestService.populateStatus(pull);
                        }, handleError);
                });
                data.pullRequests = repos;
                data.tags = tagService.createTitleTags(repos);
                data.repos = tagService.createRepoTags(repos);

                $scope.tags = data.tags;
                $scope.users = data.users;
                $scope.repos = data.repos;
                filterPullRequests();
            };

            var handleError = function(error) {
                $scope.error = error;
            };

            $scope.selectTag = function(val) {
                if (val == null) {
                    resetFilter();
                } else {
                    data.filterByMethod = filter.byTitle;
                    data.filterByValue = val;
                }
                filterPullRequests();
            };

            $scope.selectUser = function(val) {
                if (val == null) {
                    resetFilter();
                } else {
                    data.filterByMethod = filter.byUser;
                    data.filterByValue = val;
                }
                filterPullRequests();
            };

            $scope.refresh = function() {
                $scope.progress = 20;
                apiService.getRepos().then(handleRepos, handleError);
            };

            resetFilter();
            $scope.refresh();
        }
    ]);

})();