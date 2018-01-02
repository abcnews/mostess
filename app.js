const request = require('request');
const express = require('express');
const parse = require('url').parse;
const https = require('https');
const http = require('http');
const path = require('path');
const dns = require('dns');
const fs = require('fs');

module.exports = (program, config, relativeRoot) => {
  const app = express();

  // Resolved hostname cache.
  let resolved = {};

  // Clear DNS cache every 5 mins.
  setInterval(() => {
    resolved = {};
  }, 1000 * 60 * 5);

  app.get('/*', (req, res) => {
    // Parse the URL
    let url = parse(req.url).pathname;

    // Make any replacements.
    config.searchandreplace.forEach((replace) => {
      url = url.replace(replace[0], replace[1]);
    });

    let redirect;
    config.redirect.forEach((thisRedirect) => {
      if (url.match(thisRedirect[0])) {
        redirect = url.replace(thisRedirect[0], thisRedirect[1]);
      }
    });

    if (redirect) {
      console.log('Redirect: ', req.url);
      res.writeHead(302, { Location: redirect });
      res.end();
      return;
    }

        // Go through each path & see if we should serve it locally.
    for (let i = 0; i < config.paths.length; i += 1) {
      const thisPath = config.paths[i];

      // Does this url match?
      const regex = new RegExp(thisPath[0]);
      if (url.match(regex)) {
        // Check if the local file exists.
        const localFile = path.resolve(relativeRoot, thisPath[1] + url.replace(regex, ''));
        if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
          // It exists. Send that.
          console.log('Local:    ', req.url);
          res.header('Access-Control-Allow-Origin', '*');
          res.sendFile(localFile);
          return;
        }
      }
    }


    // If we can't serve the local version, proxy it from the remote server.
    function go(remoteServer) {
      const proto = req.connection.encrypted ? 'https://' : 'http://';
      const remoteUrl = proto + remoteServer + req.url;

      const requestOpts = {
        // The remote URL is direct IP, because we have HOSTS set.
        url: remoteUrl,
        // The actual hostname is passed through from the client
        // As well as cookies, accepts and CORS origin stuff. :)
        headers: req.headers,
        followRedirect: false,
      };

    // Go!
      request(requestOpts)
        .on('error', (e) => {
          console.log('Error', e.message);
          return false;
        })
        .on('response', (response) => {
            // We have a response. Send the headers.
          console.log('Remote:   ', remoteUrl);
          Object.keys(response.headers).forEach((header) => {
            const value = response.headers[header];
            // Some headers, cookies usually, can be sent multiple times.
            if (typeof value === 'object') {
              value.forEach((i) => {
                res.header(header, i);
              });
            } else {
                    // Others we just send.
              res.header(header, value);
            }
          });
        })
        // Pipe the output from request direct to the client.
        .pipe(res);
    }

    // Check if we've previously resolved this host.
    if (!resolved[req.headers.host]) {
      // If not, resolve & save.
      dns.resolve(req.headers.host, (err, resp) => {
        if (err) {
          res.writeHead(500);
          res.end(`Could not resolve ${req.headers.host}`);
          return;
        }
        console.log('resolved %s to %s', req.headers.host, resp[0]);
        resolved[req.headers.host] = resp[0];
        go(resp[0]);
      });
    } else {
      // Otherwise continue.
      go(resolved[req.headers.host]);
    }
  });

  function listenError(e) {
    console.log('Error starting up:', e.message);
  }

  http.createServer(app).on('error', listenError).listen(80, () => {
    console.log('Listening on port 80.');
  });
  if (config.https) {
    https.createServer(config.https, app).on('error', listenError).listen(443, () => {
      console.log('Listening on port 443.');
    });
  }
};
