var path = require('path');
    rimraf = require('rimraf'),
    require('colors'),
    fs = require('fs'),
    exists = fs.existsSync || fs.existsSync;

if (!exists('./tests')) {
    console.error("Not inside a module directory: cd yui3/src/yui; yui-coverage".red.bold);
    process.exit(1);
}

process.on('SIGINT', function() {
    console.error('Cleaning up tmp files'.magenta);
    rimraf(covDir, function() {
        console.error('Cleanup complete'.white);
        process.exit(0);
    });
});

module.exports = {
    start: function(opts) {
        var server = require('./server');
        server.start(opts);
    }
};
