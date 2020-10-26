const GenericDevice = require('./GenericDevice')
const { MoveEntity } = require('../../Entity')

class MotionSensor extends GenericDevice {
  get icon() { return 'fa fa-running' }

  async Start() {
    await super.Start()
    this.entities.motion = new MoveEntity(this, 'motion', 'Motion', 'fa fa-running')
    this.LinkUpEntities()
  }

  ProcessMessageObj(topic, messageobj) {
    if (topic === this.GetTopic()) {
      if (messageobj.occupancy) this.entities.motion.DoMove()
    }

    return super.ProcessMessageObj(topic, messageobj)
  }
}
module.exports = MotionSensor
