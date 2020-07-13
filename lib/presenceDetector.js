const EventEmitter = require('events');
const { exec } = require('child_process');
const os = require('os');

class PresenceDescriptor extends EventEmitter {
  network_mac = [];
  isdate = null;

  constructor(name, displayname, faicon) {
    super();

    this.name = name;
    this.displayname = displayname || name;
    this.faicon = faicon;
  }

  get Name() { return this.name; }
  get DisplayName() { return this.displayname; }
  get FaIcon() { return this.faicon; }

  get Is() { return this.isdate; }

  AddNetworkMac(mac) {
    this.network_mac.push(mac.toLowerCase());
  }

  UpdateOnlineStatus(maclist) {
    console.log(maclist)
    let is = false;
    this.network_mac.forEach(function (mac) {
      if (maclist.includes(mac))
        is = true;
    });

    if (is) {
      if (!this.isdate) {
        this.isdate = new Date().getTime();
        this.emit('change', true);
        return true;
      }
    }
    else {
      if (this.isdate) {
        this.isdate = null;
        this.emit('change', false);
        return true;
      }
    }

    return false;
  }

}

class PresenceDetector extends EventEmitter {
  objects = [];
  network_mac = [];

  get Objects() { return this.objects; }

  constructor() {
    super();

    this.InitPresenceObjects();

    // Update in every minutes
    setInterval(function () {
      this.UpdatePresence(this.UpdatePresenceObjects.bind(this));
    }.bind(this), 60 * 1000);
  }

  async InitPresenceObjects() {
    const PresenceObject = require.main.require("./models/PresenceObject");
    const objs = await PresenceObject.GetAllPriorityOrder();

    this.objects = [];
    objs.forEach(function (obj) {
      const pdesc = new PresenceDescriptor(obj.Name, obj.DisplayName, obj.FaIcon);
      if (obj.NetworkMac)
        pdesc.AddNetworkMac(obj.NetworkMac);
      this.objects.push(pdesc);
    }.bind(this));

    this.UpdatePresence(this.UpdatePresenceObjects.bind(this));
  }

  UpdatePresenceObjects() {
    const changed = [];

    this.objects.forEach(function (obj) {
      if (obj.UpdateOnlineStatus(this.network_mac))
        changed.push(obj.Name);
    }.bind(this))

    if (changed.length)
      this.emit('change', changed);
  }

  UpdatePresenceProcessResult(lines) {
    this.network_mac = [];
    lines.forEach(function (line) {
      const match = line.toLowerCase().match(/(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))/);
      if (match)
        this.network_mac.push(match[1].replace(/-/g, ':'));
    }.bind(this));

    this.network_mac = this.network_mac.filter((x, i) => i === this.network_mac.indexOf(x))
    this.network_mac.sort();

    logger.debug(`[Presence] ${this.network_mac.length} network MAC address detected`);
  }

  UpdatePresence(cb) {
    const isWindows = (os.platform() === "win32");

    if (isWindows)

      exec('arp -a', (error, stdout, stderr) => {
        if (error)
          logger.error(error.message);
        if (stderr)
          logger.error(stderr);

        const lines = stdout.split(os.EOL);

        this.UpdatePresenceProcessResult(lines);

        cb();
      });

    else

      exec('arp-scan -gxlRNq', (error, stdout, stderr) => {
        if (error)
          logger.error(error.message);
        if (stderr)
          logger.error(stderr);

        const lines = stdout.split(os.EOL);

        this.UpdatePresenceProcessResult(lines);

        cb();
      });
  }
}

module.exports = PresenceDetector;