(function() {
    'use strict';

    var module = angular.module('pullreq.directives.pullrequest', [
        'lib.lodash'
    ]);

    module.directive('pullRequest', [function() {

        return {
            restrict: "E",
            replace: true,
            scope: {
                request: '='
            },
            controller: ['$scope', '$rootScope', function($scope, $rootScope) {

                $scope.displayDetails = function() {
                    $rootScope.$broadcast('display-details', $scope.request);
                }

            }],
            templateUrl: 'pullreq/partials/pullRequest.html'
        };
    }]);

    module.directive('repo', ['$timeout', function($timeout) {

        return {
            restrict: "E",
            replace: true,
            scope: {
                repo: '=',
                pullRequests: "="
            },
            controller: ['$scope', function($scope) {

                var areAllPullsLoaded = function() {
                    var loaded = _.every($scope.pulls, function(pull) { return pull.info != null; });
                    if (!loaded) {
                        $timeout(areAllPullsLoaded, 100);
                    } else {
                        $scope.pulls = _.sortBy($scope.pulls, function(pull) {
                            return pull.status_flags.review_approved ? 0 : 1;
                        });
                    }
                };

                $scope.$watch('pullRequests', function(newVal, oldVal) {
                    var pulls = _.where(newVal, { 'tags': {
                        'repo': $scope.repo.tagName()
                    }});
                    $scope.pulls = pulls;
                    //areAllPullsLoaded();
                });

            }],
            templateUrl: 'pullreq/partials/repo.html'
        };
    }]);

})();