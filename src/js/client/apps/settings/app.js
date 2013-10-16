(function() {

    var module = angular.module('settings', [
        'settings.controllers',
        'settings.partials',
        'ngAnimate',
        'ngRoute'
    ]);

    module.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/repos', {
                templateUrl: 'settings/partials/reposView.html',
                controller: 'reposController'
            })
            .when('/warnings', {
                templateUrl: 'settings/partials/warningsView.html',
                controller: 'warningsController'
            })
            .otherwise({
                redirectTo: function() {
                    return '/repos';
                }
            });
        $locationProvider.html5Mode(false).hashPrefix('');
    }]);

})();