const IrDevice = require('./IrDevice')

class IrReceiverDevice extends IrDevice {
  SendIrCode(handlerdevice, ircode) { this.platform.SendIrCode(handlerdevice, ircode) }
  SendIrObject(handlerdevice, irobject) { this.SendIrCode(handlerdevice, JSON.stringify(irobject)) }
}
module.exports = IrReceiverDevice
