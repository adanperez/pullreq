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
        '$q',
        '_',
        'apiService',
        'tagService',
        'pullRequestService',
        '$rootScope',
        '$location',
        function($scope, $timeout, $q, _, apiService, tagService, pullRequestService, $rootScope, $location) {

            var data = {
                filterByMethod: null,
                filterByValue: null
            };

            $rootScope.$on('display-details', function(message, args) {
                $scope.request = args;
            });

            $scope.$on('$locationChangeStart', function(next, current) {
                if(!$scope.request && current.indexOf('/details') !== -1) {
                    $location.path('/pulls');
                }
            });

            var filter = {
                byUser: function(user) {
                    var pulls = data.pullRequests;
                    if(user != null) {
                        pulls = _.where(pulls, { 'user': {
                            'login': user
                        }});
                        data.filterByMethod = this;
                        data.filterValue = user;
                    }
                    $scope.repos = pullRequestService.createRepos(pulls);
                },
                byTitle: function(tag) {
                    var pulls = data.pullRequests;
                    if(tag != null) {
                        pulls = _.where(pulls, { 'tags': { 'title': tag } });
                        data.filterByMethod = this;
                        data.filterValue = tag;
                    }
                    $scope.repos = pullRequestService.createRepos(pulls);
                },
                byNothing: function() {
                    $scope.repos = pullRequestService.createRepos(data.pullRequests);
                }
            };

            var resetFilter = function() {
                data.filterByMethod = filter.byNothing;
                data.filterByValue = null;
            };

            var filterPullRequests = function() {
                data.filterByMethod(data.filterByValue);
            };

            var cleanupPullRequests = function(pullRequests, paths) {
                if (pullRequests.length == 0) {
                    $scope.progress = 99;
                    $scope.repos = [];
                    $timeout(function() {
                        $scope.progress = 100;
                        $scope.noPullRequests = true;
                    }, 500);
                    return;
                }

                var count = pullRequests.length;
                var inc = Math.ceil(60 / count);

                data.warningPaths = paths;
                data.pullRequests = pullRequests;
                data.tags = tagService.createTitleTags(pullRequests);
                data.users = pullRequestService.getUsers(pullRequests);

                _.each(pullRequests, function(pull) {
                    if ($scope.request && pull.id == $scope.request.id) {
                        $scope.request = pull;
                    }
                    apiService.getPullRequestInfo(pull.base.user.login, pull.base.repo.name, pull.number, pull.head.sha).
                        then(function(info) {
                                 pull.info = info;
                                 $scope.progress += inc;
                                 pullRequestService.populateStatus(pull, data.warningPaths);
                             }, handleError);
                });

                $scope.tags = data.tags;
                $scope.users = data.users;

                filterPullRequests();
            };

            var handleError = function(error) {
                $scope.error = error;
            };

            $scope.isTagSelected = function(tag) {

            };

            $scope.isUserSelected = function(user) {

            };

            $scope.selectTag = function(val) {
                if(val == null) {
                    resetFilter();
                } else {
                    data.filterByMethod = filter.byTitle;
                    data.filterByValue = val;
                }
                filterPullRequests();
            };

            $scope.selectUser = function(val) {
                if(val == null) {
                    resetFilter();
                } else {
                    data.filterByMethod = filter.byUser;
                    data.filterByValue = val;
                }
                filterPullRequests();
            };

            $scope.refresh = function() {
                $scope.noPullRequests = false;
                $scope.progress = 10;
                $q.all({
                   paths: apiService.getWarningPaths(),
                   pulls: apiService.getPullRequests()
                }).then(function(values) {
                   $scope.progress = 40;
                   cleanupPullRequests(values.pulls, values.paths);
                });
            };

            resetFilter();
            $scope.refresh();
        }
    ]);

})();