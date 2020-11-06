const EventEmitter = require('events')
const DeviceTelemetryModel = require('../models/DeviceTelemetry')
const DeviceStateModel = require('../models/DeviceState')
const DeviceEventModel = require('../models/DeviceEvent')
const { Action } = require('./Action')
const { BoardItem } = require('./BoardItem')

class Entity extends EventEmitter {
  publics = [];
  emits = {};
  device = null;
  code = '';
  name = '';
  _icon = '';
  originalemit = null;

  get icon() { return this._icon }
  toString() { return this.name }

  constructor(device, code, name, icon) {
    super()
    this.device = device
    this.code = code
    this.name = name
    this._icon = icon

    this.originalemit = this.emit
    this.emit = function (event, entity, ...args) {
      this.originalemit(event, entity, ...args)
      global.runningContext.PublishEntityEvent(event, entity, args)
    }
  }

  Log(message) { if (this.device) this.device.LogEntity(this.code, message) }

  LinkUpActions() {
    if (this.actions) {
      for (const action of this.actions) {
        this[action.code] = function (actionparams) { if (action.handler) action.handler(actionparams) }
      }
    }
  }

  actions = [];
  GetDefaultAction() {
    if (this.actions && this.actions.length) {
      return this.actions[0]
    }
    return null
  }

  GetActionByCode(code) { return this.actions.find(i => i.code === code) }
  IsMultiAction() { return this.actions.length > 1 }
  AddAction(action) {
    if (!(action instanceof Action)) { return }

    action.entity = this
    this.actions.push(action)

    return this
  }

  boarditems = [];
  AddBoardItem(boarditem) {
    if (!(boarditem instanceof BoardItem)) { return }

    boarditem.entity = this
    this.boarditems.push(boarditem)

    return this
  }
}

class TelemetryEntity extends Entity {
  publics = ['value', 'lastvaluetime', 'lastchangetime', 'minvalue', 'maxvalue', 'percent'];
  emits = {
    update: 'entity, value',
    change: 'entity, value, originalvalue'
  };

  value = null;
  unit = '';
  smoothminute = 0;
  changetolerance = 0;
  lowwarninglevel = null;
  lowerrorlevel = null;
  highwarninglevel = null;
  higherrorlevel = null;
  lastvaluetime = null;
  lastchangetime = null;
  minvalue = Number.NEGATIVE_INFINITY;
  maxvalue = Number.POSITIVE_INFINITY;
  toString() { return `${this.value || '?'} ${this.unit}`.trim() }

  InitByPercent() {
    this.InitUnit('%')
    this.InitMinMaxValue(0, 100)
    return this
  }

  SetSmooth() {
    this.InitSmoothMinute()
    return this
  }

  InitSmoothMinute(minute = 30) {
    this.smoothminute = minute
    return this
  }

  InitChangeTolerance(changetolerance) {
    this.changetolerance = changetolerance
    return this
  }

  InitLowLevels(warninglevel, errorlevel) {
    this.lowwarninglevel = warninglevel
    this.lowerrorlevel = errorlevel
    return this
  }

  InitHighLevels(warninglevel, errorlevel) {
    this.highwarninglevel = warninglevel
    this.higherrorlevel = errorlevel
    return this
  }

  InitUnit(unit) {
    this.unit = (unit || '').trim()
    return this
  }

  InitMinValue(minvalue) {
    this.minvalue = minvalue
    return this
  }

  InitMaxValue(maxvalue) {
    this.maxvalue = maxvalue
    return this
  }

  InitMinMaxValue(minvalue, maxvalue) {
    this.InitMinValue(minvalue)
    this.InitMaxValue(maxvalue)
    return this
  }

  InitLastValue() {
    DeviceTelemetryModel.GetLastData(this.device.id, this.code)
      .then((lastvalue) => {
        if (lastvalue) {
          this.value = lastvalue
          this.lastvaluetime = new Date().getTime()
        }
      })
    return this
  }

  SetValue(value) {
    const originalvalue = this.value

    if (this.minvalue > value) this.minvalue = value
    if (this.maxvalue < value) this.maxvalue = value

    this.value = value
    this.lastvaluetime = new Date().getTime()
    DeviceTelemetryModel.InsertSync(this.device.id, this.code, value)
    this.emit('update', this, value)

    if (Math.abs(originalvalue - value) >= this.changetolerance) {
      this.lastchangetime = new Date().getTime()
      this.emit('change', this, value, originalvalue)
    }
  }

  get percent() {
    if (this.minvalue === Number.NEGATIVE_INFINITY || this.maxvalue === Number.NEGATIVE_INFINITY) { return 0 }
    return Math.round(100 * (this.value - this.minvalue) / (this.maxvalue - this.minvalue))
  }

  get iswarning() { return !this.iserror && ((this.lowwarninglevel && this.value < this.lowwarninglevel) || (this.highwarninglevel && this.value > this.highwarninglevel)) }
  get iserror() { return (this.lowerrorlevel && this.value < this.lowerrorlevel) || (this.higherrorlevel && this.value > this.higherrorlevel) }
}

//
// StateEntity
//

class StateEntity extends Entity {
  publics = ['state', 'laststatetime', 'lastchangetime'];
  emits = {
    update: 'entity, state',
    change: 'entity, state, originalstate'
  };

  state = null;
  laststatetime = null;
  lastchangetime = null;
  toString() { return this.state }
  GetState() { return this.state }
  SetState(state, icon) {
    const originalstate = this.state

    this.state = state
    if (icon) { this._icon = icon }
    this.laststatetime = new Date().getTime()
    this.emit('update', this, state)

    if (originalstate !== state) {
      this.lastchangetime = new Date().getTime()
      this.emit('change', this, state, originalstate)
    }
  }

  StateToGraph(state) {
    const result = Number.parseFloat(state)
    if (!Number.isNaN(result)) { return result }
    return 0
  }
}

class BoolStateEntity extends StateEntity {
  statenameoff = 'Off';
  statenameon = 'On';
  stateiconoff = null;
  stateiconon = null;
  toString() { return this.toStateString() }

  InitStateNames(nameoff, nameon) {
    this.statenameoff = (nameoff || '').trim()
    this.statenameon = (nameon || '').trim()
    return this
  }

  InitStateIcons(iconoff, iconon) {
    this.stateiconoff = iconoff
    this.stateiconon = iconon
    return this
  }

  get icon() {
    if (this.state) {
      if (this.stateiconon) return this.stateiconon
    } else {
      if (this.stateiconoff) return this.stateiconoff
    }
    return super.icon
  }

  Toggle() { this.SetState(!this.GetState()) }
  SetState(state) {
    super.SetState(Boolean(state))
    DeviceStateModel.InsertSync(this.device.id, this.code, state ? '1' : '0')
  }

  toStateString() { return this.state ? this.statenameon : this.statenameoff }
}

//
// InputEntity
//

class InputEntity extends Entity {
  publics = ['input', 'lastinputtime', 'lastchangetime'];
  emits = {
    update: 'entity, input',
    change: 'entity, input, originalinput'
  };

  input = null;
  lastinputtime = null;
  lastchangetime = null;
  toString() { return this.input }
  GetInput() { return this.input }
  SetInput(input, icon) {
    const originalinput = this.input

    this.input = input
    if (icon) { this._icon = icon }
    this.lastinputtime = new Date().getTime()
    this.emit('input', this, input)

    if (originalinput !== input) {
      this.lastchangetime = new Date().getTime()
      this.emit('change', this, input, originalinput)
    }
  }
}

class SwitchEntity extends Entity { }

class PushButtonEntity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    press: 'entity'
  };

  lastpresstime = null;
  DoPress() {
    this.lastpresstime = new Date().getTime()
    this.emit('press', this)
  }
}

class MoveEntity extends Entity {
  publics = ['lastmovetime'];
  emits = {
    move: 'entity'
  };

  lastmovetime = null;
  DoMove() {
    this.lastmovetime = new Date().getTime()
    this.emit('move', this)
  }
}

class ButtonEntity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    press: 'entity, clicks',
    single: 'entity',
    double: 'entity',
    triple: 'entity',
    hold: 'entity'
  };

  lastpresstime = null;
  DoPress(clicks) {
    this.lastpresstime = new Date().getTime()
    this.emit('press', this, clicks)
    switch (clicks) {
      case 1:
        DeviceEventModel.InsertSync(this.device.id, this.code, 'single')
        this.emit('single', this)
        break
      case 2:
        DeviceEventModel.InsertSync(this.device.id, this.code, 'double')
        this.emit('double', this)
        break
      case 3:
        DeviceEventModel.InsertSync(this.device.id, this.code, 'triple')
        this.emit('triple', this)
        break
      case -1:
        DeviceEventModel.InsertSync(this.device.id, this.code, 'hold')
        this.emit('hold', this)
        break
      default:
        break
    }
  }
}

module.exports = {
  Entity,

  TelemetryEntity,

  StateEntity,
  BoolStateEntity,

  InputEntity,
  SwitchEntity,
  PushButtonEntity,
  MoveEntity,
  ButtonEntity
}
