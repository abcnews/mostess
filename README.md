Mostess
=======
The hostess.

A quick 'n dirty HTTP server that serves up a configurable mix of dev &
production resources. Use this to swap in local resources while browsing a
production site.

Usage
-----
This runs on port 80 and thus needs to be run as root. To set up:

1. `sudo node ./index.js -c <config.json>`
2. Change your `/etc/hosts` file to point to this server.

The hosts file should look as follows:

```
0.0.0.0	abc.net.au www.abc.net.au
0.0.0.0	mobile.abc.net.au
```
The server will continue to run until you kill it manually. You can optionally
daemonise this with Forever, using `sudo forever ./index.js`.

Config
------

* cachebust: boolean. Adds a `_=Date.now()` cachebust string to all URLs accessed. This
  is only useful if you're running via Akamai and want to ensure everything's up to date.
* paths: An array containing local paths to search in. A local path is an array with two
  values: the requested path, and the local path it maps to. Eg. `["/", "/home/me/www/"]`
* searchandreplace: An object containing values to search and replace in the url. Eg. `{"v1.0.0": "v1.0.1"}`
* ssl: An optional object containing the following:
** key: a path to a SSL key
** cert: a path to the SSL cert.
** passphrase: a string to unlock the private key (optional);

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
