'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var DIR_ROOT = __dirname + '/..';

var path = require('path');

var log = require('debug')('gritty');

var express = require('express');
var currify = require('currify/legacy');
var wraptile = require('wraptile/legacy');
var pty = require('node-pty-prebuilt');

var Router = express.Router;

var terminalFn = currify(_terminalFn);
var connection = wraptile(onConnection);

var CMD = process.platform === 'win32' ? 'cmd.exe' : 'bash';
var isDev = process.env.NODE_ENV === 'development';

var getDist = function getDist() {
    if (isDev) return '/dist-dev';

    return '/dist';
};

module.exports = function (options) {
    options = options || {};

    var router = Router();
    var prefix = options.prefix || '/gritty';

    router.route(prefix + '/*').get(terminalFn(options)).get(staticFn);

    return router;
};

function _terminalFn(options, req, res, next) {
    var o = options;
    var prefix = o.prefix || '/gritty';

    req.url = req.url.replace(prefix, '');

    if (/^\/gritty\.js(\.map)?$/.test(req.url)) req.url = getDist() + req.url;

    next();
}

function staticFn(req, res) {
    var file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

function createTerminal(env, cols, rows) {
    cols = cols || 80;
    rows = rows || 24;

    var term = pty.spawn(CMD, [], {
        name: 'xterm-color',
        cols: cols,
        rows: rows,
        cwd: process.env.PWD,
        env: _extends({}, process.env, env)
    });

    log('Created terminal with PID: ' + term.pid);

    return term;
}

module.exports.listen = function (socket, options) {
    options = options || {};
    check(socket, options);

    var prefix = options.prefix;
    var authCheck = options.authCheck;

    socket.of(prefix || '/gritty').on('connection', function (socket) {
        var connect = connection(options, socket);

        if (!authCheck) return connect();

        authCheck(socket, connect);
    });
};

function check(socket, options) {
    if (!socket) throw Error('socket could not be empty!');

    var authCheck = options.authCheck;

    if (authCheck && typeof authCheck !== 'function') throw Error('options.authCheck should be a function!');
}

function onConnection(options, socket) {
    var term = void 0;

    socket.on('terminal', onTerminal);

    var onResize = function onResize(size) {
        size = size || {};

        var cols = size.cols || 80;
        var rows = size.rows || 25;

        term.resize(cols, rows);
        log('Resized terminal ' + term.pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
    };

    var onData = function onData(msg) {
        term.write(msg);
    };

    var onExit = function onExit() {
        socket.emit('exit');
        onDisconnect();
        onTerminal();
    };

    function onTerminal(params) {
        params = params || {};

        var env = _extends({}, params.env, socket.request.env);
        var rows = params.rows;
        var cols = params.cols;

        term = createTerminal(env, rows, cols);

        term.on('data', function (data) {
            socket.emit('data', data);
        });

        term.on('exit', onExit);

        log('Connected to terminal ' + term.pid);

        socket.on('data', onData);
        socket.on('resize', onResize);
        socket.on('disconnect', onDisconnect);
    }

    var onDisconnect = function onDisconnect() {
        term.removeListener('exit', onExit);
        term.kill();
        log('Closed terminal ' + term.pid);

        socket.removeListener('resize', onResize);
        socket.removeListener('data', onData);
        socket.removeListener('terminal', onTerminal);
        socket.removeListener('disconnect', onDisconnect);
    };
}