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

    module.directive('repository', ['$timeout', function($timeout) {

        return {
            restrict: "E",
            replace: true,
            scope: {
                repo: '='
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

                $scope.pulls = $scope.repo.pullRequests;
                areAllPullsLoaded();
            }],
            templateUrl: 'pullreq/partials/repo.html'
        };
    }]);

    module.directive('pullRequestStatus', [function() {
        return {
            restrict: "E",
            replace: true,
            scope: {
                request: "="
            },
            controller: ['$scope', function($scope) {
                $scope.$watch('request.info.status', function() {
                    if ($scope.request.info && $scope.request.info.status) {
                        $scope.status = $scope.request.info.status[0];
                    }
                });
                $scope.message = function(status) {
                    switch(status.state) {
                        case 'success':
                            return 'Successfully built.';
                            break;
                        case 'pending':
                            return 'Building...';
                            break;
                        case 'failure':
                            return 'Failure building this pull request.';
                            break;
                        default:
                            return '';
                            break;

                    }
                };
            }],
            templateUrl: 'pullreq/partials/pullRequestStatus.html'
        };
    }]);

})();