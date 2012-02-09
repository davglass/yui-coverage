#!/usr/bin/env node

var cli = require('cli'),
    path = require('path'),
    server = require('../lib/');

cli.enable('help', 'version');

var meta = require(path.join('../package.json'));

cli.parse({
    modules: ['m', 'Comma separated list of modules to cover. (overides meta)', 'string'],
    version: ['v', 'Print the version'],
    port: ['p', 'The port number to assign: default 3000', 'number', 3000]
});

cli.main(function() {
    var opts = this.options;

    if (opts.version) {
        console.log('v' + meta.version);
        return;
    }
    server.start(opts);
});

