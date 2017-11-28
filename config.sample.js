module.exports = {
  searchandreplace: [
    // Point the remote foo to the local bar
    ['foo.js', 'bar.js'],
  ],
  redirect: [
    // Redirect assets to another server
    // foo.css or bar.css will be redirected to the server on localhost:8000
    [/.*((foo|bar).css)$/, 'http://localhost:8000/$1'],
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
    key: 'path/to/key',
    cert: 'path/to/cert',
    passphrase: 'my passphrase (optional)',
  },
};
