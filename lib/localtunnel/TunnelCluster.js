const { EventEmitter } = require('events');
const fs = require('fs');
const net = require('net');
const tls = require('tls');

const HeaderHostTransformer = require('./HeaderHostTransformer');

// manages groups of tunnels
module.exports = class TunnelCluster extends EventEmitter {
  debug(iserror, message) { this.emit('debug', iserror, message) }

  constructor(opts = {}) {
    super(opts);
    this.opts = opts;
  }

  open() {
    const opt = this.opts;

    // Prefer IP if returned by the server
    const remoteHostOrIp = opt.remote_ip || opt.remote_host;
    const remotePort = opt.remote_port;
    const localHost = opt.local_host || 'localhost';
    const localPort = opt.local_port;
    const localProtocol = opt.local_https ? 'https' : 'http';
    const allowInvalidCert = opt.allow_invalid_cert;

    this.debug(false, `Establishing tunnel ${localProtocol}://${localHost}:${localPort} -> ${remoteHostOrIp}:${remotePort}`);

    // connection to localtunnel server
    const remote = net.connect({
      host: remoteHostOrIp,
      port: remotePort,
    });

    remote.setKeepAlive(true);

    const that = this;

    remote.on('error', err => {
      if (err.code === 'ECONNREFUSED') {
        this.emit(
          'error',
          new Error(
            `connection refused: ${remoteHostOrIp}:${remotePort} (check your firewall settings)`
          )
        );
      }

      remote.end();
    });

    const connLocal = () => {
      if (remote.destroyed) {
        that.debug(false, 'Remote destroyed');
        this.emit('dead');
        return;
      }

      that.debug(false, `Connecting locally to ${localProtocol}://${localHost}:${localPort}`);
      remote.pause();

      if (allowInvalidCert) {
        that.debug(false, 'Allowing invalid certificates');
      }

      const getLocalCertOpts = () =>
        allowInvalidCert
          ? { rejectUnauthorized: false }
          : {
            cert: fs.readFileSync(opt.local_cert),
            key: fs.readFileSync(opt.local_key),
            ca: opt.local_ca ? [fs.readFileSync(opt.local_ca)] : undefined,
          };

      // connection to local http server
      const local = opt.local_https
        ? tls.connect({ host: localHost, port: localPort, ...getLocalCertOpts() })
        : net.connect({ host: localHost, port: localPort });

      const remoteClose = () => {
        that.debug(false, 'Remote close');
        this.emit('dead');
        local.end();
      };

      remote.once('close', remoteClose);

      // TODO some languages have single threaded servers which makes opening up
      // multiple local connections impossible. We need a smarter way to scale
      // and adjust for such instances to avoid beating on the door of the server
      local.once('error', err => {
        that.debug(true, `Local error ${err.message}`);
        local.end();

        remote.removeListener('close', remoteClose);

        if (err.code !== 'ECONNREFUSED') {
          return remote.end();
        }

        // retrying connection to local server
        setTimeout(connLocal, 1000);
      });

      local.once('connect', () => {
        that.debug(false, 'Connected locally');
        remote.resume();

        let stream = remote;

        // if user requested specific local host
        // then we use host header transform to replace the host header
        if (opt.local_host) {
          that.debug(false, 'Transform Host header to %s', opt.local_host);
          stream = remote.pipe(new HeaderHostTransformer({ host: opt.local_host }));
        }

        stream.pipe(local).pipe(remote);

        // when local closes, also get a new remote
        local.once('close', hadError => {
          that.debug(false, `Local connection closed [${hadError}]`);
        });
      });
    };

    remote.on('data', data => {
      const match = data.toString().match(/^(\w+) (\S+)/);
      if (match) {
        this.emit('request', {
          method: match[1],
          path: match[2],
        });
      }
    });

    // tunnel is considered open when remote connects
    remote.once('connect', () => {
      this.emit('open', remote);
      connLocal();
    });
  }
};
