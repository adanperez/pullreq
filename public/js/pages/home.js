$(document).ready(function () {

    window.showdownConverter = new Showdown.converter();

    function updateProgress(percent) {
        $('#progressBar div').width(percent+'%');
    }

    function countTotalPulls(pullJson) {
        var totalPulls = 0;
        for (var key in pullJson) {
            if (pullJson.hasOwnProperty(key)) {
                var list = pullJson[key];
                totalPulls += list.length;
            }
        }
        return totalPulls;
    }

    function showNoPullMessage() {
        $('#loadingMessage h1').html('There are no open pull requests');
        $('#progressBar').hide();
        $('#userOptions').fadeIn(100);
    }

    function loadProjectsFrom(pullJson, callback) {
        var totalPulls = countTotalPulls(pullJson);
        if (totalPulls == 0) {
            showNoPullMessage();
            return;
        }

        var pullsComplete = 0;
        var projects = new PullReq.collections.Projects();
        updateProgress(50);
        for (var key in pullJson) {
            if (pullJson.hasOwnProperty(key)) {
                var list = pullJson[key];
                if (list.length == 0) {
                    continue;
                }

                (function() {
                    var project = new PullReq.models.Project({ name:key, projectId:key });
                    projects.add(project);

                    for (var i = 0; i < list.length; i++) {
                        (function() {
                            var pullRequest = list[i];
                            var repo = pullRequest.base.repo.name;
                            var owner = pullRequest.base.repo.owner.login;
                            getPullInfo(owner, repo, pullRequest.number, function(json) {
                                for (var attr in json) {
                                    pullRequest[attr] = json[attr];
                                }
                                project.get('pullRequests').add(pullRequest);
                                pullsComplete++;
                                var num = pullsComplete / totalPulls;
                                num = num * 50;
                                updateProgress(50 + Math.abs(num));
                                if (pullsComplete == totalPulls) {
                                    updateProgress(100);
                                    callback(projects);
                                }
                            });
                        })();
                    }
                })();
            }
        }
    };

    function getPullInfo(owner, repo, pullNumber, callback) {
        $.ajax({
            type: 'GET',
            url: '/api/pullRequestInfo/' + owner + '/' + repo + '/' + pullNumber,
            dataType: 'json',
            data: {}
        }).done(function (json) {
            callback(json);
        });
    }

    //var timeout;
    function getPullRequests() {
        //clearTimeout(timeout);
        //timeout = setTimeout(getPullRequests, 60000 * 5);
        $.ajax({
            type: "GET",
            url: "/api/pullRequests",
            dataType: "json",
            data: {}
        }).done(function (json) {
                loadProjectsFrom(json, function(projectsCollection) {
                    PullReq.data.collections.projects = projectsCollection;
                    $('#loadingMessage').fadeOut(200, function () {
                        var projectsView = new PullReq.views.Projects({ collection: PullReq.data.collections.projects });
                        $('#home').html(projectsView.render().el);
                        $('#userOptions').fadeIn(100);
                    });
                });
            });
    }

    getPullRequests();
});