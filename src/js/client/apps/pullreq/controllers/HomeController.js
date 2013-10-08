(function() {

    var module = angular.module('pullreq.controllers', [
        'pullreq.service.repos',
        'lib.lodash'
    ]);

    module.controller('homeController', [
        '$scope',
        '_',
        'reposService',
        function($scope, _, reposService) {

            var handleRepos = function(repos) {
                _.each(repos, function(pull) {
                    reposService.getPullRequestInfo(pull.base.user.login, pull.base.repo.name, pull.number).
                        then(function(eee) {
                            pull.info = eee;
                        }, handleError);
                });
                $scope.pullRequests = repos;
            };

            var handleError = function(error) {
                $scope.error = error;
            };

            reposService.getRepos().then(handleRepos, handleError);
            //$scope.hello = 'sss';
        }
    ]);

})();