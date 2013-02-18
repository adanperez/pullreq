$(document).ready(function () {

    //  https://gist.github.com/elidupuis/1468937
    //  format an ISO date using Moment.js
    //  http://momentjs.com/
    //  moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM YYYY")
    //  usage: {{dateFormat creation_date format="MMMM YYYY"}}
    Handlebars.registerHelper('dateFormat', function(context, block) {
        if (window.moment) {
            var f = block.hash.format || 'MMMM Do YYYY, h:mm:ss a';
            return moment(new Date(context)).format(f);
        } else {
            return context;   //  moment plugin not available. return data as is.
        };
    });

    function loadProjectsFrom(pullJson, callback) {
        var totalPulls = 0;
        var pullsComplete = 0;
        var projects = new PullReq.collections.Projects();
        for (var key in pullJson) {
            if (pullJson.hasOwnProperty(key)) {
                var list = pullJson[key];

                if (list.length == 0) {
                    continue;
                }


                totalPulls += list.length;

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
                            if (pullsComplete == totalPulls) {
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
                        $('#content').html(projectsView.render().el)
                    });
                });
            });
    }
    getPullRequests();
});