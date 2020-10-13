const IrDevice = require('../IrDevice')

class IrSender extends IrDevice {
  CollectConfigToSend(handlerdevice) { return [] }
}
module.exports = IrSender
