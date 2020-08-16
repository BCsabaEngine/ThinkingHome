const EventEmitter = require('events');
const { exec } = require('child_process');
const os = require('os');

class PresenceDescriptor extends EventEmitter {
  network_macs = [];
  ble_macs = [];
  isdate = null;
  isreason = null;

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
  get IsReason() { return this.isreason; }

  AddNetworkMac(mac) {
    this.network_macs.push(mac.toLowerCase());
  }

  AddBleMac(mac) {
    this.ble_macs.push(mac.toLowerCase());
  }

  UpdateOnlineStatus(network_maclist, ble_maclist) {
    let is = null;

    if (network_maclist)
      this.network_macs.forEach(function (mac) {
        if (network_maclist.includes(mac))
          is = "network";
      });

    if (ble_maclist)
      this.ble_macs.forEach(function (mac) {
        if (ble_maclist.includes(mac))
          is = "ble";
      });


    if (is) {
      if (!this.isdate) {
        this.isdate = new Date().getTime();
        this.isreason = is;
        this.emit('change', true);
        return true;
      }
    }
    else {
      if (this.isdate) {
        this.isdate = null;
        this.isreason = null;
        this.emit('change', false);
        return true;
      }
    }

    return false;
  }

}

class PresenceDetector extends EventEmitter {
  objects = [];

  get Objects() { return this.objects; }

  constructor() {
    super();

    this.InitPresenceObjects();

    // Update in every minutes
    setInterval(function () {
      this.UpdatePresenceObjects();
    }.bind(this), 60 * 1000);
  }

  InitPresenceObjects() {
    const PresenceObject = require.main.require("./models/PresenceObject");
    const PresenceObjectMarker = require.main.require("./models/PresenceObjectMarker");
    Promise
      .all([
        PresenceObject.GetAllPriorityOrder(),
        PresenceObjectMarker.GetAll(),
      ])
      .then(function ([objs, markers]) {
        this.objects = [];
        objs.forEach(function (obj) {
          const pdesc = new PresenceDescriptor(obj.Name, obj.DisplayName, obj.FaIcon);
          markers.forEach(marker => {
            if (marker.PresenceObject == obj.Id)
              switch (marker.Type) {
                case 'network':
                  pdesc.AddNetworkMac(marker.Marker);
                  break;
                case 'ble':
                  pdesc.AddBleMac(marker.Marker);
                  break;
              }
          });
          this.objects.push(pdesc);
        }.bind(this));
        this.UpdatePresenceObjects();
      }.bind(this));
  }

  UpdatePresenceObjects() {
    require('util').inspect(this.objects, false, null, true);
    Promise
      .all([this.GetNetworkPresences(), this.GetBlePresences()])
      .then(([network_macs, ble_macs]) => {

        if (network_macs)
          logger.debug(`[Presence] Local network MAC address detected: ${network_macs}`);
        if (ble_macs)
          logger.debug(`[Presence] Bluetooth LE MAC address detected: ${ble_macs}`);

        this.UpdatePresenceObjectsByMacs(network_macs, ble_macs);
      });
  }

  UpdatePresenceObjectsByMacs(network_macs, ble_macs) {
    const changed = [];

    this.objects.forEach(function (obj) {
      if (obj.UpdateOnlineStatus(network_macs, ble_macs)) {
        changed.push(obj.Name);
        logger.debug(`[Presence] ${obj.Name} state changed`);
      }
    }.bind(this))

    if (changed.length)
      this.emit('change', changed);
  }

  ProcessResultLines(lines) {
    let result = [];
    lines.forEach(function (line) {
      const match = line.toLowerCase().match(/(([0-9a-f]{2}[:-]){5}([0-9a-f]{2}))/);
      if (match)
        result.push(match[1].replace(/-/g, ':'));
    }.bind(this));

    result = result.filter((x, i) => i === result.indexOf(x)); //Remove duplicates
    result.sort();

    return result;
  }

  GetNetworkPresences() {
    const cmd = os.platform() === "win32" ? 'arp -a' : 'arp-scan -gxlRNq';

    return new Promise(function (resolve, reject) {
      if (!cmd) resolve([]);
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          logger.error(error.message);
          reject(error);
        }
        else if (stderr) {
          logger.error(stderr);
          reject(new Error(stderr));
        }
        else {
          const lines = stdout.split(os.EOL);
          const bles = this.ProcessResultLines(lines);
          resolve(bles);
        }
      });
    }.bind(this));
  }

  GetBlePresences() {
    const cmd = os.platform() === "win32" ? '' : 'timeout -s INT 30 hcitool lescan';

    return new Promise(function (resolve, reject) {
      if (!cmd) resolve([]);
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          logger.error(error.message);
          reject(error);
        }
        else if (stderr) {
          logger.error(stderr);
          reject(new Error(stderr));
        }
        else {
          const lines = stdout.split(os.EOL);
          const bles = this.ProcessResultLines(lines);
          resolve(bles);
        }
      });
    });
  }
}

module.exports = PresenceDetector;