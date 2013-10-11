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


            var createAndPopulateRepoTags = function(pullRequests) {
                var repos = [];
                _.each(pullRequests, function(pullRequest) {
                    var obj = {
                        owner: pullRequest.base.user.login,
                        name: pullRequest.base.repo.name,
                        tagName: function() {
                            return this.owner + '_' + this.name;
                        }
                    };
                    if (!_.any(repos, function(repo){
                        return repo.tagName() == obj.tagName()
                    })) {
                        repos.push(obj);
                    }
                    if (!pullRequest.tags) {
                        pullRequest.tags = {};
                    }
                    pullRequest.tags.repo = obj.tagName();
                });
                return _.sortBy(repos, function(repo) { return repo.name; });
            };

            return {
                createTitleTags: createAndPopulateTitleTags,
                createRepoTags: createAndPopulateRepoTags
            }
        }
    ]);
})();