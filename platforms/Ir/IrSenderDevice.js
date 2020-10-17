const IrDevice = require('./IrDevice')

class IrSenderDevice extends IrDevice {
  IsHandledBy(handlerdevice) { return false }
  CollectConfigToSend(handlerdevice) { return [] }
}
module.exports = IrSenderDevice
