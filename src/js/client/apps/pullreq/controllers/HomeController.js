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
                $scope.hello = repos;
            };

            var handleError = function(error) {
                $scope.error = error;
            };

            reposService.getRepos().then(handleRepos, handleError);
            //$scope.hello = 'sss';
        }
    ]);

})();