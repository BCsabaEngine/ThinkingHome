const IrDevice = require('./IrDevice')

class IrSenderDevice extends IrDevice {
  CollectConfigToSend(handlerdevice) { return [] }
  ReceiveIrCode(handlerdevice, ircode) { return false }
}
module.exports = IrSenderDevice
