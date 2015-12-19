var gulp            = require('gulp');
var tape            = require('gulp-tape');

gulp.task('test', function() {
    return gulp.src('tests/*.js')
        .pipe(tape({}));
});

gulp.task('default', function() {
    // place code for your default task here
});

var watcher = gulp.watch('tests/**/*.js', ['test']);
watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});