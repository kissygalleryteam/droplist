/*
combined files : 

kg/droplist/2.0.1/gulpfile

*/
var gulp = require('gulp');
var kmc = require('gulp-kmc');
var less = require('gulp-less');
var css = require('gulp-mini-css');
var src = ".",
    dest = "./build";

//包配置
var pkg = "kg/droplist/2.0.1";

//编译模板
gulp.task('xtpl', function() {
    gulp.src(src+"/lib/*.xtpl.html")
        .pipe(kmc.xtpl())
        .pipe(gulp.dest(src+"/lib"));
});


kmc.config({
    depFilePath:dest+'/mods.js',
    packages:[{
        name: pkg,
        ignorePackageNameInUri:true,
        combine:false,
        base: src
    }]
});


gulp.task('kmc', function() {
    gulp.src(src+"/index.js")
        //转换cmd模块为kissy模块
        .pipe(kmc.convert({
            fixModuleName:true,
            ignoreFiles: ['-min.js']
        }))
        //合并文件
        .pipe(kmc.combo({
            minify: true,
            ext:"-min.js",
            files:[{
                src: src+'/index.js',
                dest: dest+'/index.js'
            }]
        }))
        .pipe(gulp.dest(dest));
});

gulp.task('css', function(){
    gulp.src(src+'/*.less')
        .pipe(less())
        .pipe(gulp.dest(dest))
        .pipe(css({ext:'-min.css'}))
        .pipe(gulp.dest(dest));
});

gulp.task('watch', function() {
    gulp.watch(src+'/**/*.js', ['kmc']);
    gulp.watch(src+'/**/*.less', ['css']);
});

gulp.task('default', ['kmc','css']);
