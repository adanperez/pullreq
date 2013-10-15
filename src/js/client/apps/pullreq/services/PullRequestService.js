(function() {

    var module = angular.module('pullreq.service.pullrequests', ['lib.lodash']);

    module.factory('pullRequestService', [
        '_',
        function(_) {

            var testPaths = ['test/'];

            var getUsers = function(pullRequests) {
                var users = _.collect(pullRequests, function(pull) {
                    return pull.user.login;
                });
                return _.sortBy(_.unique(users), function(user) { return user; });
            };

            var populateStatus = function(pullRequest, warningPaths) {
                pullRequest.status_flags.review_approved = checkApproval(pullRequest);
                pullRequest.status_flags.has_tests = checkForTests(pullRequest);
                pullRequest.status_flags.has_warning = checkForWarning(pullRequest);
                pullRequest.status_flags.has_warning_paths = checkForWarningPaths(pullRequest, warningPaths);
            };

            var checkApproval = function(pullRequest) {
                var comments = pullRequest.info.issueComments;
                if (comments) {
                    comments = _.filter(comments, function(comment) {
                        return comment.body.indexOf('+1') !== -1;
                    });
                    comments =  _.unique(comments, function(comment) {
                        return comment.user.login;
                    });
                }
                return comments ? comments.length > 1 : false;
            };

            var checkForTests = function(pullRequest) {
                var files = pullRequest.info.files;
                return _.any(files, function(file) {
                    return _.any(testPaths, function(path) {
                        return file.filename.indexOf(path) !== -1;
                    });
                });
            };

            var checkForWarning = function(pullRequest) {
                return pullRequest.body.indexOf(':warning:') !== -1;
            };

            var checkForWarningPaths = function(pullRequest, warningPaths) {
                var files = pullRequest.info.files;
                var hasWarningPath = false;
                _.each(files, function(file) {
                    file.warn = _.any(warningPaths, function(path) {
                       return file.filename.indexOf(path.path) === 0;
                    });
                    hasWarningPath = hasWarningPath || file.warn;
                });
                return hasWarningPath;
            };

            var createRepos = function(pullRequests) {
                var repos = [];
                _.each(pullRequests, function(pullRequest) {

                    var repo =  _.find(repos, function(repo) {
                        return repo.owner === pullRequest.base.user.login &&
                               repo.name === pullRequest.base.repo.name;
                    });
                    if (!repo) {
                        repo = {
                            owner: pullRequest.base.user.login,
                            name: pullRequest.base.repo.name,
                            pullRequests:[]
                        };
                        repos.push(repo);
                    }
                    repo.pullRequests.push(pullRequest);
                });
                return _.sortBy(repos, function(repo) { return repo.name; });
            };

            return {
                getUsers: getUsers,
                createRepos: createRepos,
                populateStatus: populateStatus
            }
        }
    ]);
})();