const IrReceiverDevice = require('../IrReceiverDevice')
const { Entity } = require('../../Entity')
const { ButtonAction } = require('../../Action')
const { AllActionBoardItem } = require('../../BoardItem')

const mintemp = 18
const maxtemp = 30

class IrClimate extends IrReceiverDevice {
  setting = {
    handlerdevice: null,
    brandmodel: null,
    temp_cool: 22,
    temp_heat: 28,
    swing: false,
    autooffminutes: 30,
    autooffextraminutes: 15,
    toDisplayList: function () {
      const result = {}

      const senders = global.runningContext.irInterCom.GetSenderDevices()

      const devicelist = {}
      for (const device of senders) { devicelist[device.id] = device.name }
      result.handlerdevice = {
        type: 'select',
        title: __('Handler device'),
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
        title: __('Brand and model'),
        value: this.setting.brandmodel,
        lookup: JSON.stringify(brandmodels).replace(/["]/g, "'"),
        error: !this.setting.brandmodel,
        canclear: false
      }
      const temps = {}
      for (let i = mintemp; i <= maxtemp; i++) temps[i] = `${i} ℃`
      result.temp_cool = {
        type: 'select',
        title: __('Cool temperature'),
        value: this.setting.temp_cool,
        displayvalue: this.setting.temp_cool + ' ℃',
        lookup: JSON.stringify(temps).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.temp_heat = {
        type: 'select',
        title: __('Heat temperature'),
        value: this.setting.temp_heat,
        displayvalue: this.setting.temp_heat + ' ℃',
        lookup: JSON.stringify(temps).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.swing = {
        type: 'bool',
        title: __('Swing'),
        value: this.setting.swing ? __('Enabled') : __('Disabled'),
        error: false,
        canclear: false
      }
      const minutes = { 0: __('No auto off'), 5: 5, 10: 10, 15: 15, 20: 20, 30: 30, 45: 45, 60: 60 }
      result.autooffminutes = {
        type: 'select',
        title: __('Auto off'),
        value: this.setting.autooffminutes,
        displayvalue: Number.parseInt(this.setting.autooffminutes) ? __('Off after %s minutes', this.setting.autooffminutes) : __('No auto off'),
        lookup: JSON.stringify(minutes).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      result.autooffextraminutes = {
        type: 'select',
        title: __('Auto off extra'),
        value: this.setting.autooffextraminutes,
        displayvalue: Number.parseInt(this.setting.autooffextraminutes) ? __('Off after %s minutes', this.setting.autooffextraminutes) : __('No auto off'),
        lookup: JSON.stringify(minutes).replace(/["]/g, "'"),
        error: false,
        canclear: false
      }
      return result
    }.bind(this),
    toTitle: function () { return 'Air climate' },
    toSubTitle: function () { return this.setting.brandmodel }.bind(this)
  };

  get icon() { return this.setting.icon || 'fa fa-icicles' }

  autoofftimer = null
  createautoofftimer(minutes) {
    clearTimeout(this.autoofftimer)

    if (!Number.parseInt(minutes)) return

    this.autoofftimer = setTimeout(function () {
      this.device.SendClimateObject({ command: 'off' })
    }.bind(this), minutes * 60 * 1000)
  }

  entities = {
    engine: new Entity(this, 'engine', 'Engine', 'fa fa-icicles')
      .AddAction(new ButtonAction(this, 'switchoff', 'Off', 'fa fa-power-off', function () {
        this.device.SendClimateObject({
          command: 'off'
        })
        this.createautoofftimer(0)
      }))
      .AddAction(new ButtonAction(this, 'fan', 'Fan', 'fa fa-fan', function () {
        this.device.SendClimateObject({
          command: 'on',
          mode: 'fan'
        })
        this.createautoofftimer(0)
      }))
      .AddAction(new ButtonAction(this, 'cool', 'Cool', 'fa fa-icicles', function () {
        this.device.SendClimateObject({
          command: 'on',
          mode: 'cool',
          temp: this.device.setting.temp_cool,
          fan: 'auto'
        })
        this.createautoofftimer(this.setting.autooffminutes)
      }))
      .AddAction(new ButtonAction(this, 'coolextra', 'Cool+', 'fa fa-icicles', function () {
        this.device.SendClimateObject({
          command: 'on',
          mode: 'cool',
          temp: this.device.setting.temp_cool,
          fan: 'high'
        })
        this.createautoofftimer(this.setting.autooffextraminutes)
      }))
      .AddAction(new ButtonAction(this, 'heat', 'Heat', 'fa fa-hot-tub', function () {
        this.device.SendClimateObject({
          command: 'on',
          mode: 'heat',
          temp: this.device.setting.temp_heat,
          fan: 'auto'
        })
        this.createautoofftimer(this.setting.autooffminutes)
      }))
      .AddAction(new ButtonAction(this, 'heatextra', 'Heat+', 'fa fa-hot-tub', function () {
        this.device.SendClimateObject({
          command: 'on',
          mode: 'heat',
          temp: this.device.setting.temp_heat,
          fan: 'high'
        })
        this.createautoofftimer(this.setting.autooffextraminutestes)
      }))
      .AddBoardItem(new AllActionBoardItem())
  };

  GetStatusInfos() {
    const result = []
    if (!this.setting.handlerdevice) result.push({ device: this, error: true, message: __('Handler device not set') })
    if (!this.setting.brandmodel) result.push({ device: this, error: true, message: __('Brand and model not set') })
    return result
  }

  SendClimateObject(config) {
    const brandmodel = this.setting.brandmodel.split('_')
    const defaultconfig = {
      brand: brandmodel[0],
      model: brandmodel.length > 1 ? brandmodel[1] : '',
      command: 'off',
      mode: 'auto',
      temp: 25,
      fan: 'auto',
      swing: this.setting.swing ? 'on' : 'off'
    }

    const configtosend = Object.assign(defaultconfig, config)

    this.SendIrObject(Number(this.setting.handlerdevice), configtosend)
  }

  IsHandledBy(handlerdevice) { return Number(this.setting.handlerdevice) === handlerdevice }
}
module.exports = IrClimate
