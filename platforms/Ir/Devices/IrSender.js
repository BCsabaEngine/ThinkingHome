const IrDevice = require('../IrDevice')

class IrSender extends IrDevice {
  IsHandledBy(handlerdevice) { return false }
  CollectConfigToSend(handlerdevice) { return [] }
}
module.exports = IrSender
