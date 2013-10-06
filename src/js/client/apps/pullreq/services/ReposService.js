(function() {

    var module = angular.module('pullreq.service.repos', ['lib.lodash']);

    module.factory('reposService', [
        '$http',
        '$q',
        '_',
        function ($http, $q, _) {

            var getRepos = function () {
                var promise = $q.defer();
                var http = $http({
                    method: 'GET',
                    url: '/api/pullRequests'
                });
                http.success(function (repos) {
                    //_(repos).forEach(function (event) {
                    //    updateEvent(event);
                    //});
                    promise.resolve(repos);
                });
                http.error(function (data, status) {
                    if (status) {
                        promise.reject(status);
                    }
                });
                return promise.promise;
            };

            return {
                getRepos: getRepos
            }
        }
    ]);

})();