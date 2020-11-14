const dayjs = require('dayjs')

const Device = require('../Device')
const Platform = require('../Platform')
const DeviceModel = require('../../models/Device')
const ZigbeeDevice = require('./ZigbeeDevice')
const arrayUtils = require('../../lib/arrayUtils')
const objectUtils = require('../../lib/objectUtils')
const stringUtils = require('../../lib/stringUtils')

const http500 = 500
const lastlogs = 50
const networkgraphnamemaxlength = 24

class ZigbeePlatform extends Platform {
  setting = {
    toDisplayList: function () {
      const result = {}

      if (!this.bridgePermitjoin) {
        result.allowjoin = {
          type: 'button',
          title: 'Allow join',
          value: 'Allow',
          onexecute: function () { this.SendMessagePermitJoin(true) }.bind(this)
        }
      }
      if (this.bridgePermitjoin) {
        result.denyjoin = {
          type: 'button',
          title: 'Deny join',
          value: 'Deny',
          onexecute: function () { this.SendMessagePermitJoin(false) }.bind(this)
        }
      }
      result.listdevices = {
        type: 'button',
        title: 'Zigbee devices',
        value: this.bridgeDevices.length ? 'Refresh list' : 'Get list',
        onexecute: function () { this.SendMessageGetDevices() }.bind(this)
      }
      result.listnetwork = {
        type: 'button',
        title: 'Zigbee network',
        value: this.bridgeNetworkNodes.length ? 'Refresh graph' : 'Get graph',
        onexecute: function () { this.SendMessageNetworkMap() }.bind(this)
      }

      return result
    }.bind(this)
  };

  msgcounter = {
    incoming: 0,
    outgoing: 0,
    startdate: new Date().getTime(),
    GetMinuteRatio() {
      const now = new Date().getTime()
      const minutes = (now - this.startdate) / 1000 / 60
      if (minutes > 0) {
        const value = ((this.incoming + this.outgoing) / minutes).toFixed(0)
        return `${value} /min`
      }
      return '0 /min'
    }
  };

  bridgeVersion = '';
  bridgeCoordinatorType = '';
  bridgeCoordinatorRevision = '';
  bridgeLoglevel = '';
  bridgeNetworkChannel = '';
  bridgePermitjoin = undefined;
  bridgeNetworkDateTime = null;
  bridgeNetworkNodes = [];
  bridgeNetworkLinks = [];

  bridgeDevices = [];

  bridgeLog = [];

  GetStatusInfos() {
    const result = []
    result.push({ message: 'Received', value: this.msgcounter.incoming || '0' })
    result.push({ message: 'Sent', value: this.msgcounter.outgoing || '0' })
    result.push({ message: 'Load', value: this.msgcounter.GetMinuteRatio() })

    result.push({ message: '' })
    if (this.bridgeVersion) result.push({ message: 'Zigbe2mqtt version', value: `v${this.bridgeVersion}` })
    if (this.bridgeCoordinatorType) result.push({ message: 'Coordinator type', value: this.bridgeCoordinatorType })
    if (this.bridgeCoordinatorRevision) result.push({ message: 'Coordinator revision', value: this.bridgeCoordinatorRevision })
    if (this.bridgeLoglevel) result.push({ message: 'Log level', value: this.bridgeLoglevel })
    if (this.bridgeNetworkChannel) result.push({ message: 'Network', value: `ch ${this.bridgeNetworkChannel}` })
    if (this.bridgePermitjoin) result.push({ message: 'Join to network', value: 'Allowed' })

    const statusinfos = super.GetStatusInfos()
    if (Array.isArray(statusinfos)) {
      result.push({ message: '' })
      for (const statusinfo of statusinfos) {
        if (statusinfo.error || statusinfo.warning) { result.push(statusinfo) }
      }
    }
    return result
  }

  SendMessage(topic, message) {
    this.msgcounter.outgoing++
    global.runningContext.zigbeeInterCom.SendZigbeeMqtt(topic, message)
  }

  SendMessagePermitJoin(allow) {
    if (allow === undefined) {
      this.SendMessage('bridge/config/permit_join', '')
    } else {
      this.SendMessage('bridge/config/permit_join', allow ? 'true' : 'false')
      if (allow) setTimeout(function () { this.SendMessagePermitJoin(false) }.bind(this), 10 * 60 * 1000)
    }
  }

  SendMessageGetDevices() { this.SendMessage('bridge/config/devices/get', '') }
  SendMessageNetworkMap() { this.SendMessage('bridge/networkmap', 'raw') }

  OnMessage(topic, message) {
    this.msgcounter.incoming++
    const messagestr = message.toString()

    let messageobj = null
    if (messagestr && (messagestr.startsWith('{') || messagestr.startsWith('[{'))) { try { messageobj = JSON.parse(messagestr) } catch { messageobj = null } }

    if (topic.startsWith('bridge/')) {
      switch (topic) {
        case 'bridge/log':
          if (messageobj) {
            const type = messageobj.type
            let message = messageobj.message
            let meta = messageobj.meta

            if (!['devices', 'groups'].includes(type)) {
              if (typeof message === typeof {}) message = objectUtils.objectToString(message)
              if (meta) {
                if (typeof meta === typeof {}) meta = objectUtils.objectToString(meta)
                message += ' meta: ' + meta
              }

              this.bridgeLog.push({ date: new Date().getTime(), type: type, message: message })

              while (this.bridgeLog.length > lastlogs) { this.bridgeLog = this.bridgeLog.slice(1) }

              global.wss.BroadcastToChannel(`platform_${this.GetCode()}`)
            }
          }
          break

        case 'bridge/config':
          if (messageobj) {
            this.bridgeVersion = messageobj.version
            this.bridgeCoordinatorType = messageobj.coordinator.type
            this.bridgeCoordinatorRevision = messageobj.coordinator.meta.revision
            this.bridgeLoglevel = messageobj.log_level
            this.bridgeNetworkChannel = messageobj.network.channel
            this.bridgePermitjoin = messageobj.permit_join

            global.wss.BroadcastToChannel(`platform_${this.GetCode()}`)
          }
          break

        case 'bridge/config/devices':
          if (messageobj) {
            this.bridgeDevices = []
            for (const device of messageobj) {
              this.bridgeDevices.push({
                type: device.type,
                ieee: device.ieeeAddr,
                description: device.description,
                manufacturer: device.manufacturerName,
                vendor: device.vendor,
                model: device.model,
                powersource: device.powerSource,
                lasttime: dayjs(device.lastSeen).format('YYYY-MM-DD HH:mm:ss'),
                lasttimehuman: dayjs(device.lastSeen).fromNow()
              })
            }
            global.wss.BroadcastToChannel(`platform_${this.GetCode()}`)
          }
          break

        case 'bridge/networkmap/raw':
          if (messageobj) {
            this.bridgeNetworkNodes = []
            this.bridgeNetworkLinks = []
            for (const node of messageobj.nodes) {
              const ieee = node.ieeeAddr
              const device = this.devices.find(d => d.setting.topic === ieee)
              this.bridgeNetworkNodes.push({
                type: node.type,
                ieee: ieee,
                lastSeen: node.lastSeen,
                name: node.definition ? node.definition.description : '',
                devicename: device ? device.name : ''
              })
            }
            for (const link of messageobj.links) {
              this.bridgeNetworkLinks.push({
                source: link.sourceIeeeAddr,
                target: link.targetIeeeAddr,
                lqi: link.lqi
              })
            }
            this.bridgeNetworkDateTime = new Date().getTime()
            global.wss.BroadcastToChannel(`platform_${this.GetCode()}`)
          }
          break

        default:
          break
      }
      return true
    }

    for (const device of this.devices) {
      if (messageobj) {
        if (device.ProcessMessageObj(topic, messageobj)) return true
      } else {
        if (device.ProcessMessage(topic, messagestr)) return true
      }
    }

    return false
  }

  async Start() {
    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/adddevice', this.WebAddDevice.bind(this))
    this.approuter.post('/deletedevice', this.WebDeleteDevice.bind(this))
    this.approuter.get('/networkmap.js', this.WebNetworkMapJs.bind(this))
    this.approuter.post('/forceremove', this.WebForceRemove.bind(this))

    for (const device of await DeviceModel.GetPlatformDevicesSync(this.GetCode())) { await this.CreateAndStartDevice(device.Type, device.Id, device.Name) }
    await super.Start()
    logger.info(`[Platform] ${this.constructor.name} started with ${this.devices.length} device(s)`)

    setTimeout(function () {
      this.SendMessagePermitJoin() // Retrieve config
      this.SendMessageGetDevices()
      this.SendMessageNetworkMap()
    }.bind(this), 3 * 1000)

    setInterval(function () {
      this.SendMessageGetDevices()
      this.SendMessageNetworkMap()
    }.bind(this), 60 * 60 * 1000)
  }

  async CreateAndStartDevice(type, id, name) {
    try {
      const deviceobj = ZigbeeDevice.CreateByType(type, id, this, name)
      await deviceobj.Start()
      this.devices.push(deviceobj)
      arrayUtils.sortByProperty(this.devices, 'name')

      this.approuter.use(`/device/${name}`, deviceobj.approuter)
      logger.debug(`[Platform] Device created ${this.GetCode()}.${type}=${name}`)
      return deviceobj
    } catch (err) {
      logger.error(`[Platform] Cannot create device (${name}) because '${err.message}'`)
    }
  }

  async StopAndRemoveDevice(id) {
    try {
      for (let i = 0; i < this.devices.length; i++) {
        const device = this.devices[i]
        if (device.id === id) {
          await device.Stop()
          global.app.remove(device.approuter, this.approuter)
          this.devices.splice(i, 1)
          logger.debug(`[Platform] Device deleted ${this.GetCode()}`)
          break
        }
      }
    } catch (err) {
      logger.error(`[Platform] Cannot delete device (${id}) because '${err.message}'`)
    }
  }

  async WebMainPage(req, res, next) {
    const maxitemswithoutgrouping = 6

    arrayUtils.sortByProperty(this.devices, 'name')
    const devicegroups = this.devices.length > maxitemswithoutgrouping ? arrayUtils.groupByFn(this.devices, (device) => device.setting.toTitle(), { itemsortproperty: 'name' }) : null

    res.render('platforms/zigbee/main', {
      title: 'Zigbee platform',
      platform: this,
      devicecount: this.GetDeviceCount(),
      devices: this.devices,
      devicegroups: devicegroups,
      handlers: ZigbeeDevice.GetTypes(),
      bridgedevices: this.bridgeDevices,
      bridgelogs: this.bridgeLog,
      bridgenetworkdatetime: this.bridgeNetworkDateTime
    })
  }

  async WebAddDevice(req, res, next) {
    const type = req.body.type
    const name = req.body.name.toLowerCase()
    const settings = req.body.settings

    if (!Device.IsValidDeviceName(name)) { return res.status(http500).send(`Invalid device name: ${name}`) }

    const id = await DeviceModel.InsertSync(name, this.GetCode(), type)

    const deviceobj = await this.CreateAndStartDevice(type, id, name)

    if (settings) {
      for (const key of Object.keys(settings)) { deviceobj.AdaptSetting(key, settings[key]) }
    }

    res.send(name)
  }

  async WebDeleteDevice(req, res, next) {
    const id = Number.parseInt(req.body.id)

    await DeviceModel.DeleteSync(id, this.GetCode())

    await this.StopAndRemoveDevice(id)

    res.send('OK')
  }

  async WebNetworkMapJs(req, res, next) {
    const result = []

    result.push('function drawnetwork(elementid)')
    result.push('{')
    result.push('  var nodes = new vis.DataSet([')

    for (let i = 0; i < this.bridgeNetworkNodes.length; i++) {
      const node = this.bridgeNetworkNodes[i]

      switch (node.type) {
        case 'Coordinator':
          result.push(`    { id: ${i}, label: "Coordinator", shape: "circle", color: "#FFAAAA"  },`)
          break
        case 'Router':
          result.push(`    { id: ${i}, label: "Router\\n${stringUtils.truncate(node.devicename, networkgraphnamemaxlength)}", shape: "circle", color: "#AAFFAA"  },`)
          break
        default:
          result.push(`    { id: ${i}, label: "${stringUtils.truncate(node.devicename, networkgraphnamemaxlength)}\\n${stringUtils.truncate(node.name, networkgraphnamemaxlength)}"  },`)
          break
      }
    }

    result.push('  ]);')
    result.push('  var edges = new vis.DataSet([')

    for (const link of this.bridgeNetworkLinks) {
      const sourceindex = this.bridgeNetworkNodes.findIndex(n => n.ieee === link.source)
      const targetindex = this.bridgeNetworkNodes.findIndex(n => n.ieee === link.target)

      if (sourceindex >= 0 && targetindex >= 0) {
        if (link.lqi) result.push(`    { from: ${sourceindex}, to: ${targetindex}, arrows: "to", label: "${link.lqi}", font: { align: "horizontal" } },`)
        else result.push(`    { from: ${sourceindex}, to: ${targetindex}, arrows: "to" },`)
      }
    }

    result.push('  ]);')
    result.push('  var data = { nodes: nodes, edges: edges };')
    result.push('  var options = { nodes: { shape: "box" } };')
    result.push('  new vis.Network(document.getElementById(elementid), data, options);')
    result.push('}')

    res.send(result.join('\n'))
  }

  async WebForceRemove(req, res, next) {
    const ieee = req.body.ieee

    this.SendMessage('bridge/config/force_remove', ieee)
    this.SendMessageGetDevices()

    res.send('OK')
  }

  static GetHandlerCount() { return Object.keys(ZigbeeDevice.GetTypes()).length }
  GetCode() { return ZigbeePlatform.GetCode() }
  GetName() { return ZigbeePlatform.GetName() }
  GetDescription() { return ZigbeePlatform.GetDescription() }
  static GetPriority() { return '020' }
  static GetCode() { return 'zigbee' }
  static GetName() { return 'Zigbee' }
  static GetDescription() { return 'IoT messages over 2.4GHz' }
}
module.exports = ZigbeePlatform
