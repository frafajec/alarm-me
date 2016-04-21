module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // tasks:start
        // development check-up
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: false,
                latedef: true,
                newcap: false,
                noarg: true,
                sub: true,
                undef: true,
                unused: 'vars',
                boss: true,
                eqnull: true,
                browser: true,
                loopfunc: true,
                globals: {
                    jQuery: false,
                    debug: true
                }
            },
            files: {
                src: ['build/options/js/options.js', 'build/*.js']
            }
        },

        copy: {
            pre: {
                expand: true,
                cwd: 'build',
                src: '**',
                dest: 'tmp/'
            },
            post: {
                expand: true,
                cwd: 'tmp',
                src: '**',
                dest: 'dist/'
            }
        },

        // productions setups
        uglify: {
            options: {
                banner: '/*! Alarm Me! Chrome extension\n copyright Filip Rafajec\n <%= grunt.template.today("yyyy-mm-dd") %> */\n' //TODO licence!
            },
            build: {
                files: {
                    'tmp/libs/classie.min.js': ['tmp/libs/classie.js'],
                    'tmp/libs/selectFX.min.js': ['tmp/libs/selectFX.js'],

                    'tmp/background.min.js': ['tmp/background.js'],
                    'tmp/popup.min.js': ['tmp/popup.js'],
                    'tmp/options/options.min.js': ['tmp/options/options.js']
                }
            }
        },

        cssmin: {
            target: {
                files: [{
                    'tmp/libs/normalize.min.css': ['tmp/libs/normalize.css'],
                    'tmp/libs/selectFX.min.css': ['tmp/libs/selectFX.css'],

                    'tmp/popup.min.css': ['tmp/popup.css'],
                    'tmp/options/options.min.css': ['tmp/options/options.css']
                }]
            }
        },

        //'string-replace': {
        //    dist: {
        //        files: [{
        //            expand: true,
        //            cwd: 'tmp/',
        //            src: '**/popup.html',
        //            dest: 'tmp/'
        //        }],
        //        options: {
        //            replacements: [{
        //                pattern: 'popup.js',
        //                replacement: 'popup.min.js'
        //            }]
        //        }
        //    }
        //},

        'string-replace': {
            dist: {
                files: [
                    { src: 'tmp/manifest.json', dest: 'tmp/' },
                    { src: 'tmp/popup.html', dest: 'tmp/' },
                    { src: 'tmp/options/options.html', dest: 'tmp/options/' }
                ],
                options: {
                    replacements: [
                        { pattern: 'background.js', replacement: 'background.min.js' },
                        { pattern: 'popup.css', replacement: 'popup.min.css' },
                        { pattern: 'popup.js', replacement: 'popup.min.js' },

                        { pattern: 'normalize.css', replacement: 'normalize.min.css' },
                        { pattern: 'selectFX.css', replacement: 'selectFX.min.css' },
                        { pattern: 'selectFx.js', replacement: 'selectFx.min.js' },
                        { pattern: 'classie.js', replacement: 'classie.min.js' },
                        { pattern: 'options.css', replacement: 'options.min.css' },
                        { pattern: 'options.js', replacement: 'options.min.js' }
                    ]
                }
            }
        },

        compress: {
            main: {
                options: {
                    archive: 'alarmMe_<%= pkg.version %>.zip'
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['**'], dest: '/'}
                ]
            }
        },


        // production clean-up
        clean: {
            pre: [
                'tmp/libs/classie.js', 'tmp/libs/selectFX.js', 'tmp/background.js', 'tmp/popup.js', 'tmp/options/options.js',
                'tmp/libs/normalize.css', 'tmp/libs/selectFX.css', 'tmp/popup.css', 'tmp/options/options.css'
            ],
            post: ['tmp']
        }

        // tasks:end
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-string-replace');

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    //grunt.registerTask('default', ['jshint', 'copy:pre', 'uglify', 'cssmin', 'clean:pre', 'string-replace', 'copy:post', 'compress', 'clean:post']);
    grunt.registerTask('default', ['copy:pre', 'uglify', 'cssmin', 'clean:pre', 'string-replace', 'copy:post', 'compress', 'clean:post']);

};