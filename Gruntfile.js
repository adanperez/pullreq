var _ = require('lodash');

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-lesslint');

    var config = {
        jsDistDir: 'public/js/apps',
        cssDistDir: 'public/css',
        lessDir: 'src/less',
        jsDir: 'src/js/client/apps',
        buildDir: 'build'
    };

    var lessFiles = {
        '<%= config.cssDistDir %>/main.min.css' : [
            'public/lib/bootstrap/dist/css/bootstrap.min.css',
            '<%= config.lessDir %>/layout.less',
            '<%= config.lessDir %>/pages/intro.less',
            '<%= config.lessDir %>/pages/home.less'
        ]
    };

    function generateJSAppConfigs() {
        var apps = [];

        // Find the apps to build
        grunt.file.recurse(config.jsDir + '/', function callback(abspath, rootdir, subdir, filename) {
           var name = subdir.split('/')[0];
            if (!_.contains(apps, name)) {
                apps.push(name);
            }
        });

        _(apps).forEach(function(appName) {
            var jsSrcFiles = config.jsDir + '/' + appName + '/**/*.js';
            var partialsDir = config.jsDir + '/' + appName + '/partials/';
            var partialFiles = partialsDir + '**/*.html';

            var jsBuildDir = config.buildDir + '/';
            var jsBuildFile = jsBuildDir + appName + '.js';
            var jsBuildPartialsFile = jsBuildDir + appName + '.partials.js';
            var jsDistFile = config.jsDistDir + '/' + appName + '.js';

            /**
             * Setup NG Templates
             */
            var ngTemplatesConfig = {
                options: {
                    module: appName + '.partials',
                    standalone: true,
                    htmlmin: {
                        collapseBooleanAttributes:  true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeRedundantAttributes: true
                    }
                },
                cwd: config.jsDir,
                src: [ appName + '/partials/**.html'],
                dest: jsBuildPartialsFile
            };
            grunt.config('ngtemplates.' + appName, ngTemplatesConfig);


            var ngMinConfig = {
                files: [{
                    src: jsBuildFile,
                    dest: jsDistFile
                }]
            };
            grunt.config('ngmin.' + appName, ngMinConfig);

            /**
             * Concat settings
             */
            var concatConfigObj = {
                src: [jsSrcFiles, jsBuildPartialsFile],
                dest: jsBuildFile
            };
            grunt.config('concat.' + appName, concatConfigObj);


            /**
             * Uglify settings
             */
            var uglifyConfigObj = {
                options: {
                    banner: '/*! ' + appName + ' - ' + grunt.template.today("yyyy-mm-dd") + ' */',
                    compress: true,
                    report: 'gzip',
                    preserveComments: false
                },
                files: {}
            };
            uglifyConfigObj.files[jsDistFile] = [jsDistFile];
            grunt.config('uglify.' + appName, uglifyConfigObj);

            var watchConfigObj = {
                files: [
                    jsSrcFiles,
                    partialFiles
                ],
                tasks: [
                    'ngtemplates:' + appName,
                    'concat:' + appName,
                    'ngmin:' + appName
                ]
            };
            grunt.config('watch.' + appName, watchConfigObj);
        });
    }



    // Project configuration.
    grunt.initConfig({

        config:config,

        // Protect angular code from minification
        ngmin: {},

        // Compile angular templates
        ngtemplates: {},

        // Merge files together
        concat: {},

        // Delete files
        clean: {
            dist: {
                src: ['public/js', 'public/css', 'build']
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

        // Test runner
        karma: {
            options: {
                configFile: 'test/js/config/karma.conf.js',
                port: grunt.option('port') || 9876
            },
            dev: {
                singleRun: true,
                browsers: ['Chrome', 'Firefox']
            },
            prod: {
                singleRun: true,
                browsers: ['Chrome', 'Firefox']
            },
            phantom: {
                browsers: ['PhantomJS']
            }
        },

        // JS lint
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

         // CSS lint
         csslint: {
             options: {
                 formatters: [
                     {id: 'lint-xml', dest: 'build/reports/csslint/csslint.xml'}
                 ],
                 ids: false,
                 import: 2,
                 "box-sizing": false,
                 "box-model": false,
                 "outline-none": false,
                 "qualified-headings": false,
                 "unique-headings": false,
                 "universal-selector": false,
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

        // Less lint
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

    grunt.registerTask('compile', ['ngtemplates', 'concat', 'ngmin']);
    grunt.registerTask('prod-assemble', ['clean:dist', 'compile', 'uglify', 'less:production']);
    grunt.registerTask('dev-assemble', ['clean:dist', 'compile', 'less:development']);

    grunt.registerTask('dev-run', ['dev-assemble', 'watch']);
    grunt.registerTask('prod-run', ['prod-assemble', 'watch']);

    grunt.registerTask('dev-test', ['dev-assemble', 'karma:dev']);
    grunt.registerTask('prod-test', ['prod-assemble', 'karma:prod']);

    grunt.registerTask('dev-check', ['dev-test', 'jshint']);
    grunt.registerTask('prod-check', ['prod-test', 'jshint']);

};