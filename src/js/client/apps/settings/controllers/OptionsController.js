(function() {

    var module = angular.module('settings.controllers', [
        'pullreq.service.api',
        'lib.lodash'
    ]);

    module.controller('settingsController', [
        '$scope',
        '$timeout',
        '$q',
        '_',
        'apiService',
        function($scope, $timeout, $q, _, apiService) {
        }
    ]);

    module.controller('reposController', [
        '$scope',
        '$timeout',
        '$q',
        '_',
        'apiService',
        function($scope, $timeout, $q, _, apiService) {

            var data = {};

            var loadRepos = function(repos, options) {
                $scope.options = options;
                data.selectedRepos = repos;
            };

            var handleError = function() {
                alert('oh nos!');
            };

            $scope.isRepoSelected = function(repo) {
                return _.any(data.selectedRepos, function(selectedRepo) {
                    return selectedRepo.owner === repo.owner.login.toLowerCase() &&
                        selectedRepo.repo === repo.name.toLowerCase()
                });
            };

            $scope.toggleRepoSelect = function(repo) {
                var removed = _.remove(data.selectedRepos, function(selectedRepo) {
                    return selectedRepo.owner === repo.owner.login.toLowerCase() &&
                    selectedRepo.repo === repo.name.toLowerCase()
                });
                if (removed.length == 0) {
                    data.selectedRepos.push({
                        owner: repo.owner.login.toLowerCase(),
                        repo: repo.name.toLowerCase()
                    });
                }
            };

            $scope.saveRepos = function() {
                $scope.saving = true;
                apiService.saveUserReposOptions(data.selectedRepos).then(function() {
                    $scope.saved = true;
                    $scope.saving = false;
                    $timeout(function() {
                        $scope.saved = false;
                    }, 3000);
                }, handleError)
            };

            $scope.refresh = function() {
                $q.all({
                    repos: apiService.getUserReposOptions(),
                    options: apiService.getRepoOptions()
                }).then(function(values) {
                    loadRepos(values.repos, values.options);
                }, handleError);
            };

            $scope.refresh();
        }
    ]);

    module.controller('warningsController', [
        '$scope',
        '$timeout',
        '$q',
        '_',
        'apiService',
        function($scope, $timeout, $q, _, apiService) {

            var loadPaths = function(paths) {
                $scope.paths = paths;
            };

            var handleError = function() {
                alert('oh nos!');
            };

            $scope.savePaths = function() {
                $scope.saving = true;
                apiService.saveWarningPaths($scope.paths).then(function() {
                    $scope.saved = true;
                    $scope.saving = false;
                    $timeout(function() {
                        $scope.saved = false;
                    }, 3000);
                }, handleError)
            };

            $scope.addPath = function() {
                $scope.paths.push({path:null});
            };

            $scope.removePath = function(index) {
                $scope.paths.splice(index, 1);
            };

            $scope.refresh = function() {
                $q.all({
                    paths: apiService.getWarningPaths()
                }).then(function(values) {
                        loadPaths(values.paths);
                    }, handleError);
            };

            $scope.refresh();
        }
    ]);

})();