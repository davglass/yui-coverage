var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    exec = require('child_process').exec,
    express = require('express');
    base = path.join(process.cwd(), 'tests'),
    covDir = '/tmp/yui-coverage/';

var moduleName = path.basename(process.cwd());

var mods = {};
var modules = [];

var YUI;

var parseUpstream = function(options, moduleName) {
    var mods = [];
    if (options.modules) {
        mods = options.modules.replace(/ /g, '').split();
    }
    if (!mods.length) {
        mods.push(moduleName);
    }
    options.modules = [];
    var ypath = path.join(process.cwd(), '../../build/yui-nodejs/yui-nodejs.js');
    if (path.existsSync(ypath)) {
        if (!YUI) {
            YUI = require(ypath).YUI;
        }
        var Y = YUI();
        var loader = new Y.Loader({
            ignoreRegistered: true
        });
        loader.require(mods);
        var out = loader.resolve(true);
        out.jsMods.forEach(function(i) {
            options.modules.push(i.name);
            parseModuleMeta(i.name, true);
        });
    } else {
        console.error('[error]'.bold.red, 'Could not find yui-nodejs seed to parse upstream');
    }

    options.modules = options.modules.join(',');
    return options;
};

var _parse = function(file, moduleName, skipMeta) {
    var meta, i, m,
        metaPath = path.join('../', moduleName, 'meta', file);

    if (moduleName === 'yui') {
        mods['yui-core'] = true;
    }
    
    if (skipMeta) {
        mods[moduleName] = true;
    } else {
        if (path.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath));
        } else {
            console.log(('Failed to find meta for' + moduleName).bold.red);
            console.log(metaPath.bold.red);
            return;
        }

        for (i in meta) {
            mods[i] = true;
            for (m in meta[i]) {
                switch (m) {
                    case 'use':
                        meta[i].use.forEach(function(k) {
                            mods[k] = true;
                        });
                        break;
                    case 'submodules':
                    case 'plugins':
                        Object.keys(meta[i][m]).forEach(function(k) {
                            mods[k] = true;
                            if (meta[i][m][k].submodules) {
                                Object.keys(meta[i][m][k].submodules).forEach(function(m) {
                                    mods[m] = true;
                                });
                            }
                        });
                        break;
                }
            }
        }
    }

    modules = Object.keys(mods).sort();
};

var parseModuleMeta = function(moduleName, skipMeta) {
    var meta, i, m,
        metaPath = path.join('../', moduleName, 'meta', moduleName + '.json');

    var modDir = path.join('../', moduleName, 'meta');
    var files = fs.readdirSync(modDir);

    files.forEach(function(f) {
        var ext = path.extname(f);
        if (ext === '.json') {
            _parse(f, moduleName, skipMeta);
        }
    });
    
};

var app = express.createServer();
app.configure(function() {
    app.use(express.bodyParser());
});

var io = require('socket.io').listen(app);
io.set('log level', 1);

var resultSocket;

io.sockets.on('connection', function (socket) {
    resultSocket = socket;
});


app.get('/', function(req, res, next) {
    fs.readdir(base, function(err, d) {
        var files = [];
        d.forEach(function(file) {
            var ext = path.extname(file);
            if (ext.indexOf('htm') > 0) {
                files.push(file);
            } else {
                var dir = path.join(base, d, file);
                var stat = fs.statSync(dir);
                if (stat.isDirectory()) {
                    var subfiles = fs.readdirSync(dir);
                    subfiles.forEach(function(f) {
                        var ext = path.extname(f);
                        if (ext.indexOf('htm') > 0) {
                            files.push(path.join(file, f));
                        }
                    });
                }
            }
        });
        if (files.length > 1) {
            var str = '<h1>Choose your test file</h1><ul>';
            files.sort();
            files.forEach(function(f) {
                str += '<li><a href="' + f + '">' + f + '</a></li>';
            });
            str += '</ul>';
            res.send(str);
        } else {
            //Redirect here so the next handler get's called..
            res.redirect('/' + files[0]);
        }
    });
});


var serveCoverage = function(module, res) {
    
    console.log('Serving Coverage file for: '.white, module.yellow);
    var dir = path.join(covDir, module + '_' + Date.now());
    mkdirp(dir, function() {
        var modpath = path.join(process.cwd(), '../../build/', module, module + '.js');
        var covModFile = path.join(dir, module + '.js');
        var cmd = 'java -jar "' + path.join(__dirname, '../java/yuitest-coverage.jar') + '" -o "' + covModFile + '" "' + modpath + '"';
        console.log('Executing Coverage Jar against'.magenta, module.yellow);
        exec(cmd, function() {
            console.log('Coverage complete, serving..'.white, module.yellow);
            fs.readFile(covModFile, function(err, str) {
                res.contentType('.js');
                res.send(str);
            });
        });
    });
};

app.get('/dynamic/reporter.js', function(req, res) {
    res.contentType('.js');
    res.send(fs.readFileSync(path.join(__dirname, '../lib/reporter.js'), 'utf8'));
});

var lastResult;

app.post('/results', function(req, res) {
    console.log('Results Received, writing to file and converting output'.yellow);
    var dir = path.join(covDir, 'results-' + Date.now());
    lastResult = path.join(dir, 'results.json');
    mkdirp(dir, function() {
        console.log('Writing last results'.white);
        fs.writeFileSync(lastResult, req.body.results, 'utf8');
        console.log('Building Coverage Report'.magenta);
        var cmd = 'java -jar "' + path.join(__dirname, '../java/yuitest-coverage-report.jar') + '" -o "' + dir + '" "' + lastResult + '"';
        exec(cmd, function() {
            if (resultSocket) {
                resultSocket.emit('done', { });
            }
            console.log('Coverage Report Complete'.magenta);
        })
    });
    
    res.send('Good');
});

app.get('/results/'+'*', function(req, res) {
    var file = req.params[0];
    if (!file) {
        file = 'index.html';
    }
    console.log('Serving Results..'.white, file.yellow);

    var p = path.join(path.dirname(lastResult), file);
    if (path.existsSync(p)) {
        console.log('File Path:'.white, p.yellow);
        fs.readFile(p, 'utf8', function(err, str) {
            res.contentType('.html');
            res.send(str);
        });
    } else {
        console.log('Trying to load results with no content, redirecting to /'.magenta);
        res.redirect('/');
    }
});

app.get('/results', function(req, res) {
    res.redirect('/results/');
});


var append = '<script src="/socket.io/socket.io.js"></script>';
    append += '<script src="/dynamic/reporter.js"></script>';

app.get('*', function(req, res) {

    var file = req.params[0];
    var ext = path.extname(file);
    var cover = false;
    var doAppend = false;

    var item = file.split('/');

    if (mods[item[2]] && ext === '.js') {
        cover = true;
        if (item[2].indexOf('selector') > -1) {
            cover = false;
        }
    }
    

    if (cover) {
        serveCoverage(item[2], res);
    } else {

        //Check Build
        var p = path.join(process.cwd(), '../../', file);
        //Check src
        if (!path.existsSync(p)) {
            var p = path.join(process.cwd(), '../', file);
        }
        //Check ./tests/
        if (!path.existsSync(p)) {
            if (path.extname(p).indexOf('htm') > 0) {
                doAppend = true;
            }
            var p = path.join(base, file);
        }
        if (!path.existsSync(p)) {
            res.send(404);
            //res.redirect('/');
            return;
        }
        fs.readFile(p, function(err, str) {
            res.contentType(ext);
            if (doAppend) {
                str += append;
            }
            res.send(str);
        });
    }
});

module.exports = {
    start: function(options) {
        var port = options.port;
        if (options.modules) {
            modules = options.modules.replace(/ /, '').split(',');
            mods = {};
            modules.forEach(function(module) {
                parseModuleMeta(module);
            });
        } else {
            parseModuleMeta(moduleName);
        }
        if (options.upstream) {
            options = parseUpstream(options, moduleName);
        }

        if (!modules.length || !Object.keys(mods).length) {
            console.error('No modules found to cover, bailing'.bold.red);
            process.exit(1);
        }

        console.log(('Starting server: http://127.0.0.1:' + port + '/').magenta);
        console.log('Serving coverage files for these modules: '.white, modules.join().yellow);

        app.listen(port);
    }
};

