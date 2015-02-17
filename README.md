HTTPS SNI workarounds
=======

### Server

```bash
git clone git@github.com:coolaj86/demo-https-sni-fail-workaround.git
pushd demo-https-sni-fail-workaround

tree certs

node https-sni-workaround.js
```

### Clients

<https://local.helloworld3000.com:65443> (you must manually check warnings and accept cert in Chrome / Firefox)

```bash
curl https://local.helloworld3000.com:65443 --cacert certs/ca/dummy-root-ca.crt.pem

curl https://localhost:65443 --insecure
```

Works with
  * node v0.10
  * node v0.11
  * node v0.12
  * io.js v1.2

Tested on
  * ARM (Raspberry Pi)
  * OS X

For the bugs mentioned at
  * https://github.com/iojs/io.js/issues/869
  * https://github.com/joyent/node/issues/9236
  * https://github.com/iojs/io.js/issues/867

Tactics
=======

* don't accidentally load `.key.pem` or any non `.crt.pem` file type
* do test if SNICallback callback exists

Viewing the Included Certs
=========

```bash
openssl x509 -in certs/ca/my-root-ca.crt.pem -text -noout
```
