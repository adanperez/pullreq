(function() {

    var module = angular.module('pullreq.service.tags', ['lib.lodash']);

    module.factory('tagService', [
        '_',
        function(_) {
            var re = /^([A-Za-z]+)\-?(\d+)?.*$/i;
            var createAndPopulateTitleTags = function(pullRequests) {
                var tags = [];
                _.each(pullRequests, function(pullRequest) {
                    var title = pullRequest.title;
                    var res = title.match(re);
                    if (res) {
                        var tagName = res[1].toUpperCase();
                        if (!_.contains(tags, tagName)) {
                            tags.push(tagName);
                        }
                        if (!pullRequest.tags) {
                            pullRequest.tags = {};
                        }
                        pullRequest.tags.title = tagName;
                    }
                });
                return _.sortBy(tags, function(tag) { return tag; });
            };

            return {
                createTitleTags: createAndPopulateTitleTags
            }
        }
    ]);
})();