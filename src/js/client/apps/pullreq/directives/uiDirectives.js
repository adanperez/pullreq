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
            controller: ['$scope', function($scope) {}],
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
                //var urlPattern = /((http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?)/gim;
                //htmlText = htmlText.replace(urlPattern, '<a target="_blank" href="$1">$1</a>');
                var htmlText = markdown.toHTML(scope.text);
                element.html(htmlText);
            }
        };
    }]);

})();