/**
 * loDash
 */
angular.module('lib.lodash', []).
    factory('_', function() {
        return window._;
    });

/**
 * jQuery
 */
angular.module('lib.jquery', []).
    factory('$jq', function() {
        return window.jQuery;
    });