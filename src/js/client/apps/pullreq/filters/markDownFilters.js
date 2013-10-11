(function() {
    'use strict';

    var module = angular.module('pullreq.filters', []);

    module.filter('markDown', [function() {
        return function(text) {
            return markdown.toHTML(text);
        };
    }]);

})();