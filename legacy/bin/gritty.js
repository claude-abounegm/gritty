#!/usr/bin/env node


'use strict';

var argv = process.argv;
var name = argv[2];
var option = argv[3];

switch (name) {
    case '-v':
        version();
        break;

    case '--version':
        version();
        break;

    case '-h':
        help();
        break;

    case '--help':
        help();
        break;

    case '--path':
        path();
        break;

    case '--port':
        start(option);
        break;

    default:
        start();
}

function path() {
    var join = require('path').join;
    console.log(join(__dirname, '..'));
}

function start(port) {
    check(port);
    port = getPort(port);

    var DIR = __dirname + '/../';

    var gritty = require('../');
    var http = require('http');

    var express = require('express');
    var io = require('socket.io');

    var app = express();
    var server = http.createServer(app);

    var ip = process.env.IP || /* c9 */
    '0.0.0.0';

    app.use(gritty()).use(express.static(DIR));

    var socket = io.listen(server);
    gritty.listen(socket);
    server.listen(port, ip);

    console.log('url: http://localhost:' + port);
}

function getPort(port) {
    if (!isNaN(port)) return port;

    return process.env.PORT || /* c9           */
    process.env.app_port || /* nodester     */
    process.env.VCAP_APP_PORT || /* cloudfoundry */
    1337;
}

function help() {
    var bin = require('../help');
    var usage = 'Usage: gritty [options]';

    console.log(usage);
    console.log('Options:');

    Object.keys(bin).forEach(function (name) {
        console.log('  %s %s', name, bin[name]);
    });
}

function version() {
    var pack = require('../package');
    console.log('v' + pack.version);
}

function check(port) {
    if (port && isNaN(port)) exit('port should be a number 0..65535');
}

function exit(msg) {
    console.error(msg);
    process.exit(-1);
}