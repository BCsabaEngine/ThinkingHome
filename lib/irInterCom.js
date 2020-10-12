const ThBlitzwolfIR = require('../platforms/Mqtt/Devices/ThBlitzwolfIR')

module.exports = {

  IrReceiverClasses: [ThBlitzwolfIR],
  IrSenderClasses: [ThBlitzwolfIR],

  GetReceiverDevices() {
    const result = []

    for (const device of global.runningContext.GetDevices()) {
      for (const IrReceiverClass of this.IrReceiverClasses) {
        if (device instanceof IrReceiverClass) { result.push(device) }
      }
    }

    return result
  },

  GetSenderDevices() {
    const result = []

    for (const device of global.runningContext.GetDevices()) {
      for (const IrSenderClass of this.IrSenderClasses) {
        if (device instanceof IrSenderClass) { result.push(device) }
      }
    }

    return result
  },

  SendIr(ircode) {
    let any = false
    for (const sender of this.GetSenderDevices()) {
      if (sender.SendIr(ircode)) { any = true }
    }
    if (!any) { logger.warn(`[IR intercom] Cannot send code '${ircode}'. Is any IR sender?`) }
  },

  IrReceived(ircode) {
    if (global.runningContext.platforms) {
      const ir = global.runningContext.platforms.ir
      if (!ir) {
        logger.warn('[IR intercom] IR platform not found or not enabled')
        return
      }

      const delegated = ir.OnReceiveIrCode(ircode)
      if (!delegated) { logger.warn(`[IR intercom] No device found for code '${ircode}'`) }
    }
  }

}
