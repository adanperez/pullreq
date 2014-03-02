(function() {

    var module = angular.module('pullreq', [
        'pullreq.filters',
        'pullreq.controllers',
        'pullreq.partials',
        'pullreq.directives.pullrequest',
        'pullreq.directives.ui',
        'ngAnimate',
        'ngRoute',
        'ui.bootstrap.tooltip',
        'ui.bootstrap.tabs',
        'template/tooltip/tooltip-popup.html',
        'template/tabs/tab.html',
        'template/tabs/tabset.html',
        'template/tabs/tabset-titles.html'
    ]);

    module.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
        $routeProvider
            .when('/pulls', {
                templateUrl: 'pullreq/partials/pullsView.html'
            })
            .when('/details', {
                templateUrl: 'pullreq/partials/detailsView.html'
            })
            .otherwise({
                redirectTo: function() {
                    return '/pulls';
                }
            });
        $locationProvider.html5Mode(false).hashPrefix('');
    }]);

})();