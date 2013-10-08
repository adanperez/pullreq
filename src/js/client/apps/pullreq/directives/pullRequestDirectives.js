(function() {
    'use strict';

    var module = angular.module('pullreq.directives', [
        'lib.lodash'
    ]);

    module.directive('pullRequest', [function() {

        return {
            restrict: "E",
            replace: true,
            scope: {
                request: '='
            },
            controller: ['$scope', function($scope) {}],
            templateUrl: 'pullreq/partials/pullRequest.html'
        };
    }]);

})();