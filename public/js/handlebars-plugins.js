
//  https://gist.github.com/elidupuis/1468937
//  format an ISO date using Moment.js
//  http://momentjs.com/
//  moment syntax example: moment(Date("2011-07-18T15:50:52")).format("MMMM YYYY")
//  usage: {{dateFormat creation_date format="MMMM YYYY"}}
Handlebars.registerHelper('dateFormat', function(context, block) {
    if (window.moment) {
        var f = block.hash.format || 'MMMM Do YYYY'; //, h:mm:ss a
        return moment(new Date(context)).format(f);
    } else {
        return context;   //  moment plugin not available. return data as is.
    };
});

Handlebars.registerHelper('dateDetailsFormat', function(context, block) {
    if (window.moment) {
        var f = block.hash.format || 'MMMM Do YYYY h:mm a'; //, h:mm:ss a
        return moment(new Date(context)).format(f);
    } else {
        return context;   //  moment plugin not available. return data as is.
    };
});

Handlebars.registerHelper('markDown', function(context) {
    if (window.showdownConverter) {
        return showdownConverter.makeHtml(context);
    } else {
        return context;
    };
});

Handlebars.registerHelper('splitName', function(context) {
    var name = context.split('/');
    return  name[1] + '<small>\\' + name[0] + '</small>';
});

Handlebars.registerHelper('percentage', function(v1, v2) {
    var name = v1 / v2;
    return name * 100;
});

Handlebars.registerHelper('addValues', function(v1, v2) {
    return v1 + v2;
});

Handlebars.registerHelper('iconStatus', function(context) {
    switch(context) {
        case 'modified':
            return 'circle-blank';
        case 'added':
            return 'circle';
        case 'removed':
            return 'remove';
        default:
            return '';
    }
});

Handlebars.registerHelper('ifOrCond', function(v1, v2, options) {
    if(v1 || v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});