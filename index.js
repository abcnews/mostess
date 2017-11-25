#!/usr/bin/node
const fs = require('fs');
const app = require('./app');
const program = require('commander');
const path = require('path');
const packageJson = require('./package.json');

program
    .version(packageJson.version)
    .option('-c, --config [file]', 'Config file to use', /.+/)
    .option('-k, --key [file]', 'SSL key to use', /.+/)
    .option('-c, --cert [file]', 'SSL cert to use', /.+/)
    .option('-p, --passphrase [passphrase]', 'Passphrase to unlock key', /.+/)
    .parse(process.argv);

if (program.config && !fs.existsSync(program.config)) {
  program.help();
}

let config = {};
const relativeRoot = process.cwd();

if (program.config) {
    // We have a config file!
  config = JSON.parse(fs.readFileSync(path.join(path.resolve(program.config), program.config)));
} else {
    // No config file, apply some defaults.
    // Set this folder as the relative root.
  console.log('No config specified. Serving from \n', relativeRoot);

    // Set a default config to serve this path.
  config = {
    paths: [['/', '']], // Map the root folder to this the cwd.
  };
}

if (program.key) {
  config.https = {
    key: fs.readFileSync(program.key),
    cert: fs.readFileSync(program.cert),
  };
  if (program.passphrase) {
    config.tls.passphrase = program.passphrase;
  }
}

app(program, config, relativeRoot);
