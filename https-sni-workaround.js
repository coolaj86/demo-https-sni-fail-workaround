'use strict';
 
var https           = require('https');
var fs              = require('fs');
var path            = require('path');
var crypto          = require('crypto');

module.exports.create = function (securePort, insecurePort) {
    // SSL Server
  var secureContexts  = {};
  var dummyCerts;
  var secureOpts;
  var secureServer;

  function loadDummyCerts() {
    var certsPath = path.join(__dirname, 'certs');
    var certs = {
      key:          fs.readFileSync(path.join(certsPath, 'server', 'dummy-server.key.pem'))
    , cert:         fs.readFileSync(path.join(certsPath, 'server', 'dummy-server.crt.pem'))
    , ca:           fs.readdirSync(path.join(certsPath, 'ca')).filter(function (node) {
                      return /crt\.pem$/.test(node);
                    }).map(function (node) {
                      console.log('[Add CA]', node);
                      return fs.readFileSync(path.join(certsPath, 'ca', node));
                    })
    };
    return certs
  }
  dummyCerts = loadDummyCerts();

  function createSecureContext(certs) {
    // workaround for v0.12 / v1.2 backwards compat
    try {
      return require('tls').createSecureContext(certs);
    } catch(e) { 
      return require('crypto').createCredentials(certs).context;
    }
  }
  secureContexts.dummy = createSecureContext(dummyCerts);

  function runServer() {
    //provide a SNICallback when you create the options for the https server
    secureOpts = {
                    // fallback / default dummy certs
      key:          dummyCerts.key
    , cert:         dummyCerts.cert
    , ca:           dummyCerts.ca
    };

    function addSniCallback() {
      //SNICallback is passed the domain name, see NodeJS docs on TLS
      secureOpts.SNICallback = function (domainname, cb) {
        console.log('[log] SNI:', domainname);

        var secureContext = secureContexts[domainname];

        if (!secureContext) {
          // testing with shared dummy
          //secureContext = secureContexts.dummy;
          // testing passing bad argument
          //secureContext = createSecureContext(loadDummyCerts);
          // testing with fresh dummy
          secureContext = createSecureContext(loadDummyCerts());
        }

        console.log('[log]', secureContext);

        // workaround for v0.12 / v1.2 backwards compat bug
        if ('function' === typeof cb) {
          console.log('using sni callback callback');
          cb(null, secureContext);
        } else {
          console.log('NOT using sni callback callback');
          return secureContext;
        }
      };
    }

    if ('--without-sni-callback' !== process.argv[2]) {
      console.log('Testing with SNICallback');
      console.log('append --without-sni-callback to see that it works without SNICallback');
      addSniCallback();
    } else {
      console.log('Testing WITHOUT SNICallback');
      console.log('omit --without-sni-callback to test properly');
    }

    secureServer = https.createServer(secureOpts);
    secureServer.on('request', function (req, res) {
      console.log('[log] request');
      res.end('{ "result": "works" }');
    });
    secureServer.listen(securePort, function () {
      console.log("Listening on https://localhost:" + secureServer.address().port);
    });
  }

  runServer();
}
module.exports.create(65443, 65080);
