$(document).ready(function () {
    PullReq.data.collections.projects = new PullReq.collections.Projects();

    function loadProjectsFrom(pullJson) {
        var projects = PullReq.data.collections.projects;
        for (var key in pullJson) {
            if (pullJson.hasOwnProperty(key)) {
                var list = pullJson[key];
                var project = new PullReq.models.Project({ name:key, projectId:key })
                _.each(list, function(pullRequest) {
                    project.get('pullRequests').add(pullRequest);
                }, this);

                if (project.get('pullRequests').length > 0) {
                    projects.add(project);
                }
            }
        }
    };

    var timeout;
    function getPullRequests() {
        clearTimeout(timeout);
        timeout = setTimeout(getPullRequests, 60000 * 5);
        $.ajax({
            type: "GET",
            url: "/api/pullRequests",
            dataType: "json",
            data: {}
        }).done(function (json) {
                console.log(json);
                loadProjectsFrom(json);
                console.log(PullReq.data.collections.projects);
                $('#loadingMessage').fadeOut(200, function () {
                    var projectsView = new PullReq.views.Projects({ collection: PullReq.data.collections.projects });
                    $('#content').html(projectsView.render().el)
                });
            });
    }
    getPullRequests();
});