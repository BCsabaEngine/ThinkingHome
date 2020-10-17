const IrReceiverDevice = require('../IrReceiverDevice')
const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')

const mintemp = 18
const maxtemp = 30

class IrClimate extends IrReceiverDevice {
  setting = {
    handlerdevice: null,
    brandmodel: null,
    temp_cool: 22,
    temp_heat: 28,
    swing: false,
    toDisplayList: function () {
      const result = {}

      const senders = global.runningContext.irInterCom.GetSenderDevices()

      const devicelist = {}
      for (const device of senders) { devicelist[device.id] = device.name }
      result.handlerdevice = {
        type: 'select',
        title: 'Handler device',
        value: this.setting.handlerdevice,
        displayvalue: function () {
          if (this.setting.handlerdevice) {
            const owned = senders.find(d => d.id === Number(this.setting.handlerdevice))
            if (owned) { return owned.name }
          }
          return ''
        }.bind(this)(),
        lookup: JSON.stringify(devicelist).replace(/["]/g, "'"),
        error: !this.setting.handlerdevice,
        canclear: false
      }
      const brandmodels = {
        FUJITSU_ARRAH2E: 'FUJITSU',
        FUJITSU_ARDB1: 'FUJITSU (ARDB1)',
        FUJITSU_ARREB1E: 'FUJITSU (ARREB1E)',
        FUJITSU_ARJW2: 'FUJITSU (ARJW2)',
        FUJITSU_ARRY4: 'FUJITSU (ARRY4)'
      }
      result.brandmodel = {
        type: 'select',
        title: 'Brand and model',
        value: this.setting.brandmodel,
        lookup: JSON.stringify(brandmodels).replace(/["]/g, "'"),
        error: !this.setting.brandmodel,
        canclear: false
      }
      const temps = {}
      for (let i = mintemp; i <= maxtemp; i++) temps[i] = `${i} ℃`
      result.temp_cool = {
        type: 'select',
        title: 'Cool temperature',
        value: this.setting.temp_cool,
        displayvalue: this.setting.temp_cool + ' ℃',
        lookup: JSON.stringify(temps).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.temp_heat = {
        type: 'select',
        title: 'Heat temperature',
        value: this.setting.temp_heat,
        displayvalue: this.setting.temp_heat + ' ℃',
        lookup: JSON.stringify(temps).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.swing = {
        type: 'bool',
        title: 'Swing',
        value: this.setting.swing ? 'Enabled' : 'Disabled',
        error: false,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return 'Air climate' },
    toSubTitle: function () { return this.setting.brandmodel }.bind(this)
  };

  get icon() { return this.setting.icon || 'fa fa-icicles' }
  entities = {
    engine: new Entity(this, 'engine', 'Engine', 'fa fa-icicles')
      .AddAction(new ButtonAction(this, 'switchoff', 'Switch off', 'fa fa-power-off', function () { this.device.entities.sequence.DoPress() }))
      .AddAction(new ButtonAction(this, 'fan', 'Start fan', 'fa fa-fan', function () { this.device.entities.sequence.DoPress() }))
      .AddAction(new ButtonAction(this, 'cool', 'Cooling', 'fa fa-icicles', function () { this.device.entities.sequence.DoPress() }))
      .AddAction(new ButtonAction(this, 'coolextra', 'Cooling extra', 'fa fa-icicles', function () { this.device.entities.sequence.DoPress() }))
      .AddAction(new ButtonAction(this, 'heat', 'Heating', 'fa fa-hot-tub', function () { this.device.entities.sequence.DoPress() }))
      .AddAction(new ButtonAction(this, 'heatextra', 'Heating extra', 'fa fa-hot-tub', function () { this.device.entities.sequence.DoPress() }))
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.handlerdevice) result.push({ device: this, error: true, message: 'Handler device not set' })
    if (!this.setting.brandmodel) result.push({ device: this, error: true, message: 'Brand and model not set' })
    return result
  }

  SendClimateObject(settings) {
    const brandmodel = this.setting.brandmodel.split('_')
    const defaultconfig = {
      brand: brandmodel[0],
      model: brandmodel[1],
      command: 'off',
      mode: 'fan',
      temp: 25,
      fan: 'HIGH' / 'LOW',
      swing: this.setting.swing ? 'on' : 'off'
    }

    const configtosend = Object.assign(defaultconfig, this.setting)

    this.SendIrObject(configtosend)
  }

  IsHandledBy(handlerdevice) { return Number(this.setting.handlerdevice) === handlerdevice }
}
module.exports = IrClimate
