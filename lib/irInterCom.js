const ThBlitzwolfIR = require('../platforms/Mqtt/Devices/ThBlitzwolfIR')
const IrSenderDevice = require('../platforms/Ir/IrSenderDevice')
const IrReceiverDevice = require('../platforms/Ir/IrReceiverDevice')

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

  GetDevicesHandledBy(handlerdevice, senders = true, receivers = true) {
    const result = []

    for (const device of global.runningContext.GetDevices()) {
      if (senders) {
        if (device instanceof IrSenderDevice) {
          if (device.IsHandledBy(handlerdevice)) {
            result.push(device)
          }
        }
      }

      if (receivers) {
        if (device instanceof IrReceiverDevice) {
          if (device.IsHandledBy(handlerdevice)) {
            result.push(device)
          }
        }
      }
    }

    return result
  },

  SendIr(handlerdevice, ircode) {
    let any = false
    for (const sender of this.GetSenderDevices()) {
      if (sender.id === Number(handlerdevice)) {
        if (sender.SendIr(ircode)) any = true
      }
    }
    if (!any) logger.warn(`[IR intercom] Cannot send code '${ircode}' by #${handlerdevice}. Is any IR sender with this id?`)
  },

  IrReceived(handlerdevice, ircode) {
    if (global.runningContext.platforms) {
      const ir = global.runningContext.platforms.ir
      if (!ir) {
        logger.warn('[IR intercom] IR platform not found or not enabled')
        return
      }

      const delegated = ir.OnReceiveIrCode(handlerdevice, ircode)
      if (!delegated) { logger.warn(`[IR intercom] No device found for code '${ircode}' sent by #${handlerdevice}`) }
    }
  }

}
