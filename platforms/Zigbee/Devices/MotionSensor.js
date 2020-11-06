const GenericDevice = require('./GenericDevice')
const { EventEntity } = require('../../Entity')

class MotionSensor extends GenericDevice {
  get icon() { return 'fa fa-running' }

  async Start() {
    await super.Start()
    this.entities.motion = new EventEntity(this, 'motion', 'Motion', 'fa fa-running').InitEvents(['move'])
    this.LinkUpEntities()
  }

  ProcessMessageObj(topic, messageobj) {
    if (topic === this.GetTopic()) {
      if (messageobj.occupancy) this.entities.motion.DoEvent('move')
    }

    return super.ProcessMessageObj(topic, messageobj)
  }
}
module.exports = MotionSensor
