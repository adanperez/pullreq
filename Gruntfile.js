var _ = require('lodash');

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-lesslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-html2js');

    var config = {
        jsDistDir: 'public/js/apps',
        cssDistDir: 'public/css',
        lessDir: 'src/less',
        jsDir: 'src/js/client/apps'
    };

    var lessFiles = {
        '<%= config.cssDistDir %>/main.min.css' : [
            'public/lib/bootstrap/dist/css/bootstrap.min.css',
            '<%= config.lessDir %>/layout.less',
            '<%= config.lessDir %>/pages/intro.less',
            '<%= config.lessDir %>/pages/home.less'
        ]
        //,
        //'<%= config.cssDistDir %>/font-awesome.min.css' : ['<%= config.lessDir %>/font-awesome/font-awesome.less'],
        //'<%= config.cssDistDir %>/bootstrap.min.css' : ['<%= config.lessDir %>/bootstrap.less']
    };

    function generateJSAppConfigs() {
        var apps = [];
        grunt.file.recurse(config.jsDir + '/', function callback(abspath, rootdir, subdir, filename) {
           var name = subdir.split('/')[0];
            if (!_.contains(apps, name)) {
                apps.push(name);
            }
        });
        //console.log(apps);
        _(apps).forEach(function(appName) {
            console.log(appName);
            var jsSrcFiles = config.jsDir + '/' + appName + '/**/*.js';
            var partialsDir = config.jsDir + '/' + appName + '/partials/';
            var partialFiles = partialsDir + '**/*.html';

            var jsDistDir = config.jsDistDir + '/';
            var partialsJSFile = jsDistDir + appName + '.partials.js';
            var jsFile = jsDistDir + appName + '.js';
            var jsMinFile = jsDistDir + appName + '.min.js';

            var html2jsConfigObj = {
                src: [partialFiles],
                dest: partialsJSFile,
                options: {
                    base: config.jsDir,
                    module: appName + '.partials'
                }
            };
            console.log('html2js.' + appName, html2jsConfigObj);
            grunt.config('html2js.' + appName, html2jsConfigObj);

            var concatConfigObj = {
                src: [jsSrcFiles, partialsJSFile],
                dest: jsFile
            };
            grunt.config('concat.' + appName, concatConfigObj);


            var uglifyConfigObj = {
                files: { }
            };
            uglifyConfigObj.files[jsMinFile] = [ jsFile ];
            grunt.config('uglify.' + appName, uglifyConfigObj);

            var watchConfigObj = {
                files: [jsSrcFiles, partialFiles],
                tasks: ['html2js:' + appName, 'concat:' + appName]
            };
            grunt.config('watch.' + appName, watchConfigObj);
        });
    }

    // Project configuration.
    grunt.initConfig({
        config:config,
        concat: {},
        copy: {},
        html2js: {},
        clean: {
            dist: {
                src: ['public/js/app','public/css/']
            }
        },
        csslint: {
            options: {
                formatters: [
                    {id: 'lint-xml', dest: 'build/reports/csslint/csslint.xml'}
                ],
                // IDs until re-use needed. Re-factor scaredy cats!
                ids: false,
                // Yes, never import css. Collapse it.
                import: 2,
                // who cares about IE 6 and 7?
                "box-sizing": false,
                // Assuming we know the box model...
                "box-model": false,
                // Pretty rather than accessible, I guess
                "outline-none": false,
                // This OSCSS principal isn't very DRY
                "qualified-headings": false,
                "unique-headings": false,
                // Yeah it's slow. It's also spec
                "universal-selector": false,

                //TODO these are the errors we found we enabling linting
                "duplicate-background-images": false,
                "overqualified-elements": false,
                "important": false,
                "known-properties": false,
                "fallback-colors": false,
                "star-property-hack": false,
                "duplicate-properties": false,
                "display-property-grouping": false,
                "compatible-vendor-prefixes": false,
                "adjoining-classes": false,
                "vendor-prefix": false,
                "text-indent": false
            },
            src: ['css/**/*.css']
        },
        karma: {
            options: {
                configFile: 'test/js/config/karma.conf.js',
                port: grunt.option('port') || 9876
            },
            ci: {
                singleRun: true,
                browsers: ['Firefox']
            },
            dev: {
                browsers: ['Chrome', 'Firefox']
            },
            phantom: {
                browsers: ['PhantomJS']
            }
        },
        jshint: {
            all: ['web-app/src/apps/**/*.js'],
            options:{
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                unused: false,
                browser: true,
                strict: true,
                jquery: true,
                globals:{
                    angular:true,
                    console: true
                },
                reporter: 'jslint',
                reporterOutput: 'build/reports/jshint/jshint.xml'
            }
        },
        less: {
            development: {
                options: {
                    paths: ['<%= config.lessDir %>'],
                    yuicompress: false
                },
                files: lessFiles
            },
            production: {
                options: {
                    paths: ['<%= config.lessDir %>'],
                    yuicompress: true
                },
                files: lessFiles
            }
        },
        lesslint: {
            src: ['web-app/src/less/**/*.less']
        },
        uglify: {
            options: {
                compress: true,
                mangle: {
                    except: ['angular', 'jQuery']
                }
            }
        },
        watch: {
            lessCss: {
                files: '<%= config.lessDir %>/**/*.less',
                tasks: ['less']
            }
        }
    });

    generateJSAppConfigs();
    console.log(grunt.config);

    grunt.registerTask('compile', ['html2js', 'concat']);

    grunt.registerTask('clean-compile', ['clean:dist', 'compile', 'less:production']);

    grunt.registerTask('assemble', ['compile', 'uglify', 'less:production']);

    grunt.registerTask('dev-run', ['clean:dist', 'compile', 'less:development', 'watch']);

    grunt.registerTask('dev-test', ['clean:dist', 'compile', 'less:development', 'karma:ci']);

    grunt.registerTask('dev-check', ['dev-test', 'jshint']);

    grunt.registerTask('dev-assemble', ['clean:dist', 'assemble']);
};