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

            var populateStatus = function(pullRequest) {
                pullRequest.status_flags.review_approved = checkApproval(pullRequest);
                pullRequest.status_flags.has_tests = checkForTests(pullRequest);
                pullRequest.status_flags.has_warning = checkForWarning(pullRequest);
                console.log(pullRequest.status_flags);
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

            return {
                getUsers: getUsers,
                populateStatus: populateStatus
            }
        }
    ]);
})();