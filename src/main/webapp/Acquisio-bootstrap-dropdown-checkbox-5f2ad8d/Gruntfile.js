fs = require('fs');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: 
          '/*! <%= pkg.name %> - v<%= pkg.version %>\n' 
        + fs.readFileSync('LICENSE') + '*/\n' 
      },
      dist: {
        files: {
          'js/bootstrap-dropdown-checkbox.min.js': 'js/bootstrap-dropdown-checkbox.js'
        }
      } 
    },
    jshint: {
      files: ['Gruntfile.js', 'js/bootstrap-dropdown-checkbox.js', 'test/**/*.js'],
      options: {
        // Took the options used by Twitter bootstrap.
        // https://github.com/twitter/bootstrap/blob/master/js/.jshintrc
        "validthis": true,
        "laxcomma" : true,
        "laxbreak" : true,
        "browser"  : true,
        "eqnull"   : true,
        "debug"    : true,
        "devel"    : true,
        "boss"     : true,
        "expr"     : true,
        "asi"      : true,
        "multistr" : true     // because of multistr template
      }
    },
    less: {
      dist: {
        files: {
          'css/bootstrap-dropdown-checkbox.css': 'less/bootstrap-dropdown-checkbox.less'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  grunt.registerTask('default', ['jshint', 'less', 'uglify']);

};