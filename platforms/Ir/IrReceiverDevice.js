const IrDevice = require('./IrDevice')

class IrReceiverDevice extends IrDevice {
  IsHandledBy(handlerdevice) { return false }
}
module.exports = IrReceiverDevice
