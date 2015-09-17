module.exports = function (grunt) {

    // 项目配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.file %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                options: {
                    mangle: false, //不混淆变量名
                    preserveComments: false, //不删除注释，还可以为 false（删除全部注释），some（保留@preserve @license @cc_on等注释）
                    footer:'\n/*! <%= pkg.name %> 最后修改于： <%= grunt.template.today("yyyy-mm-dd") %> */'//添加footer
                },
                files: {
                    'release/js/cootek-json.js' : ['js/cootek-json.js'],
                    'release/js/angular.min.js' : ['js/angular.min.js'],
                    'release/js/bootstrap.min.js' : ['js/bootstrap.min.js'],
                    'release/js/jquery-1.11.3.min.js' : ['js/jquery-1.11.3.min.js']
                }
            }
        },
        cssmin: {
            target: {
                files: {
                    'release/css/bootstrap.min.css': ['css/bootstrap.min.css'],
                    'release/css/non-responsiveness.css': ['css/non-responsiveness.css'],
                    'release/css/cootek-json.css': ['css/cootek-json.css']
                }
            }
        }
    });

    // 加载提供"uglify"任务的插件
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    // 默认任务
    grunt.registerTask('default', ['uglify','cssmin']);
}