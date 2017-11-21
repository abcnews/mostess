var request = require('request');

var express = require('express');
var mime = require('mime-types');
var dns = require('dns');
var parse = require('url').parse;
var path = require('path');

var https = require('https');
var http = require('http');
var fs = require('fs');

module.exports = function(program, config, relativeRoot){
    var app = express();

    // Resolved hostname cache.
    var resolved = {};

    // Clear DNS cache every 5 mins.
    setInterval(function() {
        resolved = {};
    }, 1000 * 60 * 5);

    app.get('/*', function(req, res) {
        if (program.config) {
            // Load the config every request because it's easiest.
            config = JSON.parse(fs.readFileSync(program.config));
        }

        // Parse the URL
        var url = parse(req.url).pathname;

        // Make any replacements.
        for (var i in config.searchandreplace) {
            url = url.replace(i, config.searchandreplace[i]);
        }

        // Go through each path & see if we should serve it locally.
        for (var i = 0; i < config.paths.length; i++) {
            var thisPath = config.paths[i];

            // Does this url match?
            if (url.indexOf(thisPath[0]) === 0) {
                // Check if the local file exists.
                var localFile = path.resolve(relativeRoot, thisPath[1] + url.substr(thisPath[0].length));
                if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
                    // It exists. Send that.
                    console.log('Local: ', req.url);
                    var mimetype = mime.lookup(localFile);
                    res.header('Access-Control-Allow-Origin', '*');
                    res.sendFile(localFile);
                    return;
                }
            }
        }


        // If we can't serve the local version, proxy it from the remote server.
        function go(remoteServer) {
            var proto = req.connection.encrypted ? 'https://' : 'http://';
            var remoteUrl = proto + remoteServer + req.url;

            // Cachebuster adds a timestamp to all requests if it's set.
            if (config.cachebust) {
                var cachebuster = Date.now();
                remoteUrl = remoteUrl.indexOf('?') === -1 ?
                    remoteUrl + '?_=' + cachebuster :
                    remoteUrl + '&_=' + cachebuster;
            }

            var requestOpts = {
                // The remote URL is direct IP, because we have HOSTS set.
                url: remoteUrl,
                // The actual hostname is passed through from the client
                // As well as cookies, accepts and CORS origin stuff. :)
                headers: req.headers,
                followRedirect: false,
            };

            // Go!
            request(requestOpts)
                .on('error', function(e) {
                    console.log('Error', e.message);
                    return false;
                })
                .on('response', function(response) {
                    // We have a response. Send the headers.
                    console.log((config.cachebust ? 'Cachebust: ' : 'Remote: '), remoteUrl);
                    for (var header in response.headers) {
                        var val = response.headers[header];
                        // Some headers, cookies usually, can be sent multiple times.
                        if (typeof val === 'object') {
                            val.forEach(function(i) {
                                res.header(header, i);
                            });
                        } else {
                            // Others we just send.
                            res.header(header, val);
                        }
                    }
                })
                // Pipe the output from request direct to the client.
                .pipe(res);
        }

        // Check if we've previously resolved this host.
        if (!resolved[req.headers.host]) {
            // If not, resolve & save.
            dns.resolve(req.headers.host, function(err, resp) {
                console.log('resolved %s to %s', req.headers.host, resp[0]);
                resolved[req.headers.host] = resp[0];
                go(resp[0]);
            });
        } else {
            // Otherwise continue.
            go(resolved[req.headers.host]);
        }
    });

    function listenError(e){
        console.log('Error starting up:', e.message);
    }

    http.createServer(app).on('error', listenError).listen(80, function(){
        console.log('Listening on port 80.');
    });
    if (config.https) {
        https.createServer(config.https, app).on('error', listenError).listen(443, function(){
            console.log('Listening on port 443.');
        });
    }
};
