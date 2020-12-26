const ThSonoffRF = require('../platforms/Mqtt/Devices/ThSonoffRF')

module.exports = {

  RfReceiverClasses: [ThSonoffRF],
  RfSenderClasses: [ThSonoffRF],

  GetReceiverDevices() {
    const result = []

    for (const device of global.runningContext.GetDevices()) {
      for (const RfReceiverClass of this.RfReceiverClasses) {
        if (device instanceof RfReceiverClass) { result.push(device) }
      }
    }

    return result
  },

  GetSenderDevices() {
    const result = []

    for (const device of global.runningContext.GetDevices()) {
      for (const RfSenderClass of this.RfSenderClasses) {
        if (device instanceof RfSenderClass) { result.push(device) }
      }
    }

    return result
  },

  SendRf(handlerdevice, rfcode) {
    let any = false
    for (const sender of this.GetSenderDevices()) {
      if (!handlerdevice || sender.id === Number(handlerdevice)) {
        if (sender.SendRf(rfcode)) any = true
      }
    }
    if (!any) { logger.warn(`[RF intercom] Cannot send code '${rfcode}'. Is any RF sender?`) }
  },

  RfReceived(rfcode) {
    if (global.runningContext.platforms) {
      const rf = global.runningContext.platforms.rf
      if (!rf) {
        logger.warn('[RF intercom] RF platform not found or not enabled')
        return
      }

      const delegated = rf.OnReceiveRfCode(rfcode)
      if (!delegated) { logger.warn(`[RF intercom] No device found for code '${rfcode}'`) }
    }
  }

}
