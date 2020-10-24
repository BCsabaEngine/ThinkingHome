const express = require('express')
const DeviceSettingModel = require('../models/DeviceSetting')
const DeviceTelemetryModel = require('../models/DeviceTelemetry')
const DeviceStateSeriesModel = require('../models/DeviceStateSeries')
const timelineConverter = require('../lib/timelineConverter')
const { NumericValueEntity, StateEntity } = require('./Entity')
const { ButtonAction, SelectAction, RangeAction } = require('./Action')

class Device {
  id = null;
  platform = null;
  name = null;
  get icon() { return null }
  approuter = express.Router();
  setting = {
    toDisplayList: function () { return {} },
    toTitle: function () { return '' },
    toSubTitle: function () { return '' }
  };

  entities = {};
  GetStatusInfos() { return [] }
  Tick(seconds) { logger.error(`Platform.Tick not implemented in ${this}`) }

  constructor(id, platform, name) {
    this.id = id
    this.platform = platform
    this.name = name
  }

  async Start() {
    await this.ReadSettings()

    this.approuter.get('/', this.WebMainPage.bind(this))
    this.approuter.post('/entity/action/', this.WebEntityAction.bind(this))
    this.approuter.post('/setting/update', this.WebSettingUpdate.bind(this))
    this.approuter.post('/setting/toggle', this.WebSettingToggle.bind(this))
    this.approuter.post('/setting/delete', this.WebSettingDelete.bind(this))
    this.approuter.post('/setting/execute', this.WebSettingExecute.bind(this))
    this.approuter.get('/graph/telemetry/:entity', this.WebGetTelemetryGraph.bind(this))
    this.approuter.get('/graph/state/:entity', this.WebGetStateGraph.bind(this))

    this.LinkUpEntities()
  }

  async Stop() {
    this.RemoveAllListeners()
  }

  LinkUpEntities() {
    if (this.entities) {
      for (const key of Object.keys(this.entities)) {
        this.entities[key].LinkUpActions()
        this[key] = this.entities[key]
      }
    }
  }

  RemoveAllListeners() {
    if (this.entities) {
      for (const key in this.entities) { this.entities[key].removeAllListeners() }
    }
  }

  DumpBackup() { }

  WebMainPage(req, res, next) {
    res.render('platforms/device', {
      title: this.name,
      device: this,

      NumericValueEntity: NumericValueEntity,
      StateEntity: StateEntity,

      ButtonAction: ButtonAction,
      SelectAction: SelectAction,
      RangeAction: RangeAction
    })
  }

  async WebEntityAction(req, res, next) {
    const entity = req.body.entity
    const action = req.body.action
    const actionparams = req.body.actionparams

    // console.log([entity, action, actionparams]);

    const entityobj = this.entities[entity]
    if (entityobj) {
      for (const actionobj of entityobj.actions) {
        if (actionobj.code === action) {
          await actionobj.Execute(actionparams)
          break
        }
      }
    }
    res.send('OK')
  }

  async WebSettingUpdate(req, res, next) {
    await this.AdaptSetting(req.body.name, req.body.value)
    res.send('OK')
  }

  async WebSettingToggle(req, res, next) {
    await this.ToggleSetting(req.body.name)
    res.send('OK')
  }

  async WebSettingDelete(req, res, next) {
    await this.AdaptSetting(req.body.name, null)
    res.send('OK')
  }

  async WebSettingExecute(req, res, next) {
    await this.ExecuteSetting(req.body.name)
    res.send('OK')
  }

  WebGetTelemetryGraph(req, res, next) {
    const maxdays = 30
    const avgsize = 30
    const hdwidth = 1920

    const entitycode = req.params.entity
    const days = Math.max(1, Math.min(req.query.days, maxdays))

    DeviceTelemetryModel
      .GetByDeviceId(this.id, entitycode, days)
      .then(rows => {
        let timeline = []
        for (const row of rows) { timeline.push([row.DateTime.getTime(), row.Data]) }

        timeline = timelineConverter.moveAverage(timeline, avgsize)
        timeline = timelineConverter.reduceTimeline(timeline, hdwidth)

        res.send(JSON.stringify(timeline))
      })
      .catch(err => { next(err) })
  }

  WebGetStateGraph(req, res, next) {
    const maxdays = 30
    const msinday = 86400000

    const entitycode = req.params.entity
    const days = Math.max(1, Math.min(req.query.days, maxdays))

    const entity = this.entities[entitycode]
    if (entity && entity instanceof StateEntity) {
      DeviceStateSeriesModel
        .GetByDeviceId(this.id, entitycode, days)
        .then(rows => {
          const startdate = new Date()
          startdate.setTime(startdate.getTime() - days * msinday)

          const normalizedrows = DeviceStateSeriesModel.NormalizeByStartDate(rows, startdate)
          for (const row of normalizedrows) { row.State = entity.StateToGraph(row.State) }
          const stat = DeviceStateSeriesModel.GenerateTimelineStat(normalizedrows)

          res.send(JSON.stringify(stat))
        })
        .catch(err => { next(err) })
    }
  }

  async ReadSettings() {
    const settingread = await DeviceSettingModel.GetSettingsSync(this.id)
    for (const key of Object.keys(settingread)
      .filter(key => !key.startsWith('_'))
      .filter(key => key in this.setting)) { this.setting[key] = settingread[key] }
  }

  async AdaptSetting(name, value) {
    const keys = Object.keys(this.setting)
    if (!(name.startsWith('_'))) {
      if (keys.includes(name)) {
        this.setting[name] = value
        await this.WriteSetting(name, value)

        const displayitems = this.setting.toDisplayList()
        const displayitem = displayitems[name]
        if (displayitem) {
          if (typeof displayitem.onchange === 'function') { displayitem.onchange(value) }
        }
      }
    }
  }

  async ToggleSetting(name) {
    const keys = Object.keys(this.setting)
    if (!(name.startsWith('_'))) {
      if (keys.includes(name)) {
        this.setting[name] = !this.setting[name]
        await this.WriteSetting(name, this.setting[name])

        const displayitems = this.setting.toDisplayList()
        const displayitem = displayitems[name]
        if (displayitem) {
          if (typeof displayitem.onchange === 'function') { displayitem.onchange(this.setting[name]) }
        }
      }
    }
  }

  async ExecuteSetting(name) {
    const displayitems = this.setting.toDisplayList()
    const keys = Object.keys(displayitems)
    if (!(name.startsWith('_'))) {
      if (keys.includes(name)) {
        const displayitem = displayitems[name]
        if (displayitem) {
          if (typeof displayitem.onexecute === 'function') { displayitem.onexecute() }
        }
      }
    }
  }

  async WriteSetting(name, value) {
    await DeviceSettingModel.UpdateSettingSync(this.id, name, value)
  }

  async WriteSettings() {
    await DeviceSettingModel.UpdateSettingsSync(this.id, this.setting)
  }

  static IsValidDeviceName(name) { return name.match(/^[a-z0-9_]{1,32}$/) }
}
module.exports = Device
