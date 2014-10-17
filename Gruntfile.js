/*global grunt, module: false */

module.exports = function (grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // strip comments from .jshint file
        jsonmin: {
            hint: {
                options: {
                    stripWhitespace: true,
                    stripComments: true
                },
                files: {
                    '.jshint': '.jshintrc'
                }
            }
        },

        // uglify js
        uglify: {
            build: {
                files: {
                    'public/js/pages.min.js': 'public/js/pages.js',
                    'public/js/admin.min.js': 'public/js/admin.js',
                    'public/js/jquery.cookie.min.js': 'public/js/jquery.cookie.js',
                    'public/js/jquery.iframe-post-form.min.js': 'public/js/jquery.iframe-post-form.js'
                }
            }
        },

        // concat files
        concat: {
            options: {
                process: function (src, filepath) {
                    if (filepath.indexOf('.js') !== -1) {
                        src = src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, ''); // use strict statements
                        src = src.replace(/\/\*[^\*]*\*\//g, ''); // block comments
                        src = src + ';';
                        return '\n// ' + filepath + '\n' + src;
                    } else {
                        return src;
                    }
                }
            },
            js: {
                files: {
                    'public/js/main.min.js': ['public/js/jquery-ui-1.10.3.custom.min.js', 'public/js/jquery.ui.touch-punch.min.js', 'public/js/d3.v3.min.js'],
                    'public/js/play.min.js': ['public/js/pages.min.js'],
                    'public/js/cms.min.js': ['public/js/jquery.cookie.min.js', 'public/js/jquery.iframe-post-form.min.js', 'public/js/admin.min.js']
                }
            },
            css: {
                files: {
                    'public/css/main.css': ['public/css/normalize.css', 'public/css/style.css', 'public/css/pages.css'],
                    'public/css/cms.css': ['public/css/admin.css']
                }
            }
        },

        // compile less files
        less: {
            build: {
                options: {
                    paths: ['public/css'],
                    yuicompress: true
                },
                files: {
                    'public/css/normalize.css': 'public/css/normalize.less',
                    'public/css/style.css': 'public/css/style.less',
                    'public/css/pages.css': 'public/css/pages.less',
                    'public/css/admin.css': 'public/css/admin.less'
                }
            }
        },

        cssmin: {
            minify: {
                expand: true,
                cwd: 'public/css/',
                src: ['main.css', 'cms.css'],
                dest: 'public/css/',
                ext: '.min.css'
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('build', 'Builds the project', ['uglify:build', 'concat:js', 'less:build', 'concat:css', 'cssmin:minify']);

    // Default task(s).
    grunt.registerTask('default', ['build']);

};
