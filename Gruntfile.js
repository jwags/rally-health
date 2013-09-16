module.exports = function(grunt) {
    require('grunt');
    
    var config = grunt.file.readJSON('config.json');

    config.js_files = grunt.file.expand( 'src/javascript/*.js' );
    config.css_files = grunt.file.expand( 'src/style/*.css' );
    
    config.js_contents = " ";
    for (var i=0;i<config.js_files.length;i++) {
        grunt.log.writeln( config.js_files[i]);
        config.js_contents = config.js_contents + "\n" + grunt.file.read(config.js_files[i]);
    }
    
    config.style_contents = "";
    for (var i=0;i<config.css_files.length;i++) {
        grunt.log.writeln( config.css_files[i]);
        config.style_contents = config.style_contents + "\n" + grunt.file.read(config.css_files[i]);
    }
    
    config.scratch_files = ["src/javascript/_ts-logger.js"
    ];
    config.scratch_contents = " ";
    for (var i=0;i<config.scratch_files.length;i++) {
        grunt.log.writeln( config.scratch_files[i]);
        config.scratch_contents = config.scratch_contents + "\n" + grunt.file.read(config.scratch_files[i]);
    }
    
    // grunt.log.writeln( config.js_contents );
    var auth = grunt.file.readJSON('auth.json');
    config.auth = auth
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        template: {
                scratch: {
                    src: 'templates/App-scratch-tpl.html',
                    dest: 'App-scratch.html',
                    engine: 'underscore',
                    variables: config
                },
                dev: {
                        src: 'templates/App-debug-tpl.html',
                        dest: 'App-debug.html',
                        engine: 'underscore',
                        variables: config
                },
                prod: {
                        src: 'templates/App-tpl.html',
                        dest: 'deploy/App.html',
                        engine: 'underscore',
                        variables: config
                }
        },
        jasmine: {
            fast: {
                src: 'src/**/*.js',
                options: {
                    specs: 'test/fast/*-spec.js',
                    helpers: 'test/fast/*Helper.js',
                    template: 'test/fast/custom.tmpl',
                    templateOptions: config,
                    keepRunner: true,
                    junit: { 
                        path: 'test/logs/fast'
                    }
                }
            },
            slow: {
                src: 'src/**/*.js',
                options: {
                    specs: 'test/slow/*-spec.js',
                    helpers: 'test/slow/*Helper.js',
                    template: 'test/slow/custom.tmpl',
                    templateOptions: config,
                    keepRunner: true,
                    timeout: 50000,
                    junit: { 
                        path: 'test/logs/slow'
                    }
                }
            }
        }
    });

    //load
    grunt.loadNpmTasks('grunt-templater');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    
    // default creates an html file that can be copied and pasted into a Rally app
    // (uses all the files in src/javascript)
    grunt.registerTask('default', ['template:prod']);
    // debug creates an html file that can be loaded on its own without copying and pasting into Rally
    grunt.registerTask('debug', ['template:dev']);
    
    // scratch creates an html file that can be copied and pasted into a Rally app 
    // (uses only specified files for targeted review)
    grunt.registerTask('scratch', ['template:scratch']);
    
    grunt.registerTask('test-fast', ['jasmine:fast']);
    grunt.registerTask('test-slow', ['jasmine:slow']);

};
