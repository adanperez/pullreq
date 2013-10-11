(function() {
    'use strict';

    var module = angular.module('pullreq.directives.ui', [
        'lib.lodash'
    ]);

    module.directive('progressBar', [function() {

        return {
            restrict: "E",
            replace: true,
            scope: {
                progress: '='
            },
            controller: ['$scope', function($scope) {
                console.log('caad');
            }],
            templateUrl: 'pullreq/partials/progressBar.html'
        };
    }]);

    module.directive('markdown', [function() {
        return {
            restrict: 'EA',
            scope: {
                text: '='
            },
            link: function(scope, element, attrs) {
                var htmlText = markdown.toHTML(scope.text);
                element.html(htmlText);
            }
        };
    }]);

})();