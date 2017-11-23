Mostess
=======
The hostess.

A quick 'n dirty HTTP server that serves up a configurable mix of dev &
production resources. Use this to swap in local resources while browsing a
production site, or redirect resources to a local dev server.

Usage
-----
This runs on port 80 and thus needs to be run as root. To set up:

1. `sudo node ./index.js -c <config.js>`
2. Change your `/etc/hosts` file to point the remote server to localhost

The hosts file should look as follows:

```
0.0.0.0	www.example.org
```
The server will continue to run until you kill it manually.

Config
------
Config is managed as a Javascript module. The following values are supported:

* paths: An array containing local paths to search in. A local path is an array with two
  values: the requested path as a regex, and the local path it maps to. Eg. `["/", "/home/me/www/"]`
* searchandreplace: An object containing values to search and replace in the url. Eg. `{"v1.0.0": "v1.0.1"}`
* ssl: An optional object containing the following:
** key: a path to a SSL key
** cert: a path to the SSL cert.
** passphrase: a string to unlock the private key (optional);

An example config follows:

``` js
module.exports = {
  searchandreplace: {
    // Point the remote foo to the local bar
    'foo.js': 'bar.js',
  },
  redirect: [
    // Redirect assets to another server
    // foo.css or bar.css will be redirected to the server on localhost:8000
    [ /.*((foo|bar).css)$/, 'http://localhost:8000/$1' ],
  ],
  paths: [
    // Redirect this path to the local build folder
    [
      /^\/remote\/path\/v1.0.0/,
      'build/',
    ],
    // Use regexes to redirect multiple remotes to the local path
    [
      /^\/remote\/path\/[^/]+/,
      'build/',
    ],
  ],
  ssl: {
      key: "path/to/key",
      cert: "path/to/cert",
      passphrase: "my passphrase (optional)"
  }
};

```

SSL
------

SSL is useful if you're testing a site that uses SSL. SSL on port 443 is enabled
through the SSL options on the command line, or by specifying SSL options in the
config file.

Eg.

````
node index.js --key='serv.key' --cert='server.cert'
````

To generate your own SSL certificate:

````
openssl req  -nodes -new -x509  -keyout server.key -out server.cert
````

Some warnings
-------------
This is a development server. It is not intended to be run on the open Internet
or without a firewall in place. Take appropriate precautions.
