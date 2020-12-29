const EventEmitter = require('events')
const DeviceTelemetryModel = require('../models/DeviceTelemetry')
const DeviceStateModel = require('../models/DeviceState')
const DeviceEventModel = require('../models/DeviceEvent')
// const DebouncerList = require('../lib/debouncerList')
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

  SetToString(newmethod) {
    this.toString = newmethod
    return this
  }

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

  Log(message) {
    logger.debug(`[Entity] ${message} by ${this.code}`)
    if (this.device) this.device.LogEntity(this.code, message)
  }

  LinkUpActions() {
    if (this.actions) {
      for (const action of this.actions) {
        this[action.code] = function (...args) { if (action.handler) action.handler(...args) }
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
  publics = ['value', 'lastvaluetime', 'lastchangetime']
    .concat(this.minvalue !== Number.NEGATIVE_INFINITY && this.maxvalue !== Number.POSITIVE_INFINITY ? ['minvalue', 'maxvalue', 'percent'] : [])
    .concat(this.lowwarninglevel || this.lowerrorlevel || this.highwarninglevel || this.higherrorlevel ? ['iswarning', 'iserror'] : []);

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
  // debouncer = new DebouncerList(1000);
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

  SetValue(value /*, skipdeb = false */) {
    // if (!skipdeb) {
    //   this.debouncer.Add('SetValue', function () { this.SetValue(value, true) }.bind(this), value)
    //   return
    // }
    // TODO: Debouncer

    const originalvalue = this.value

    if (this.minvalue > value) this.minvalue = value
    if (this.maxvalue < value) this.maxvalue = value

    logger.debug(`[TelemetryEntity] ${this.code}: ${originalvalue} => ${value}${this.unit}`)

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
    if (this.minvalue === Number.NEGATIVE_INFINITY || this.maxvalue === Number.POSITIVE_INFINITY) return 0
    if (!this.value) return 0
    return Math.round(100 * (this.value - this.minvalue) / (this.maxvalue - this.minvalue))
  }

  get iswarning() { return !this.iserror && ((this.lowwarninglevel && this.value < this.lowwarninglevel) || (this.highwarninglevel && this.value > this.highwarninglevel)) }
  get iserror() { return (this.lowerrorlevel && this.value < this.lowerrorlevel) || (this.higherrorlevel && this.value > this.higherrorlevel) }
}

class StateEntity extends Entity {
  publics = ['state', 'laststatetime', 'lastchangetime'];

  emits = {
    update: 'entity, state',
    change: 'entity, state, originalstate'
  };

  state = null;
  laststatetime = null;
  lastchangetime = null;
  toString() { return this.state ? this.state.toString() : null }

  InitLastState() {
    DeviceStateModel.GetLastState(this.device.id, this.code)
      .then((lastvalue) => {
        if (lastvalue) {
          this.state = this.StateFromStore(lastvalue)
          this.laststatetime = new Date().getTime()
        }
      })
    return this
  }

  SetState(state) {
    const originalstate = this.state

    logger.debug(`[StateEntity] ${this.code}: ${originalstate} => ${state}`)

    this.state = state
    this.laststatetime = new Date().getTime()
    DeviceStateModel.InsertSync(this.device.id, this.code, this.StateToStore(this.state))
    this.emit('update', this, state)

    if (this.CompareState(originalstate, state)) {
      this.lastchangetime = new Date().getTime()
      this.emit('change', this, state, originalstate)
    }
  }

  CompareState(a, b) { return a !== b }

  StateToStore(state) { return state }

  StateFromStore(state) { return state }

  StateToGraph(state) {
    const result = Number.parseFloat(state)
    if (!Number.isNaN(result)) return result
    return 0
  }
}

class BoolStateEntity extends StateEntity {
  statenameoff = 'Off';
  statenameon = 'On';
  stateiconoff = null;
  stateiconon = null;
  toString() { return this.state ? this.statenameon : this.statenameoff }

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

  StateToStore(state) { return state ? 1 : 0 }

  StateFromStore(state) { return Number(state) }

  get icon() {
    if (this.state) {
      if (this.stateiconon) return this.stateiconon
    } else {
      if (this.stateiconoff) return this.stateiconoff
    }
    return super.icon
  }
}

class EventEntity extends Entity {
  publics = ['input', 'lasteventtime'];
  emits = {};

  events = []
  lasteventtime = null;

  InitEvents(events) {
    this.events = events
    this.emits = {}
    for (const event of events) {
      this.emits[event] = 'entity'
      this.publics.push(`last_${event}_time`)
    }
    return this
  }

  AddEventWithEmit(event, emit) {
    this.events.push(event)
    this.emits[event] = ['entity'].concat(emit)
    this.publics.push(`last_${event}_time`)
    return this
  }

  toString() { return this.name }
  DoEvent(event, ...args) {
    this.lasteventtime = new Date().getTime()
    this[`last_${event}_time`] = new Date().getTime()

    let eventstr = event
    if (args && args.length) for (const arg of args) eventstr += `, ${arg}`
    logger.debug(`[EventEntity] ${this.code} event: ${eventstr}`)
    DeviceEventModel.InsertSync(this.device.id, this.code, eventstr)
    this.emit(event, this, args)
  }
}

module.exports = {
  Entity,

  TelemetryEntity,

  StateEntity,
  BoolStateEntity,

  EventEntity
}
