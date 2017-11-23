#!/usr/bin/node
var fs = require('fs');
var app = require('./app');
var program = require('commander');
var path = require('path');

program
    .version(require(__dirname + '/package.json').version)
    .option('-c, --config [file]', 'Config file to use', /.+/)
    .option('-k, --key [file]', 'SSL key to use', /.+/)
    .option('-c, --cert [file]', 'SSL cert to use', /.+/)
    .option('-p, --passphrase [passphrase]', 'Passphrase to unlock key', /.+/)
    .parse(process.argv);

if (program.config && !fs.existsSync(program.config)) {
    program.help();
}

var config = {};
var relativeRoot = process.cwd();


if (program.config) {
    // We have a config file!
    config = require(path.join(path.resolve(program.config)), program.config);
} else {
    // No config file, apply some defaults.
    // Set this folder as the relative root.
    console.log('No config specified. Serving from \n',relativeRoot);

    // Set a default config to serve this path.
    config = {
        paths: [["/", ""]] // Map the root folder to this the cwd.
    };
}

if(program.key){
    config.https = {
        key: fs.readFileSync(program.key),
        cert: fs.readFileSync(program.cert)
    };
    if(program.passphrase){
        config.tls.passphrase = program.passphrase;
    }
}

app(program, config, relativeRoot);
