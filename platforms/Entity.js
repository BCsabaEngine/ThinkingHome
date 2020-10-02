const EventEmitter = require('events');
const DeviceTelemetry = require('../models/DeviceTelemetry');
const DeviceState = require('../models/DeviceState');
const DeviceEvent = require('../models/DeviceEvent');
const { Action } = require('./Action');
const { BoardItem } = require('./BoardItem');

class Entity extends EventEmitter {
  publics = [];
  emits = {};
  device = null;
  code = "";
  name = "";
  _icon = "";
  originalemit = null;

  get icon() { return this._icon; };
  toString() { return this.name; }

  constructor(device, code, name, icon) {
    super();
    this.device = device;
    this.code = code;
    this.name = name;
    this._icon = icon;
    this.originalemit = this.emit;
    this.emit = function (event, entity, ...args) {
      this.originalemit(event, entity, ...args);
      runningContext.PublishEntityEvent(event, entity, args);
    };
  }

  LinkUpActions() {
    if (this.actions)
      for (const action of this.actions)
        this[action.code] = function (actionparams) { if (action.handler) action.handler(actionparams); }
  }

  actions = [];
  GetDefaultAction() {
    if (this.actions.length > 0)
      return this.actions[0];
    return null;
  }
  GetActionByCode(code) {
    return this.actions.find(i => i.code == code);
  }
  IsMultiAction() { return this.actions.length > 1; }
  AddAction(action) {
    if (!(action instanceof Action))
      return;

    action.entity = this;
    this.actions.push(action);

    return this;
  }

  boarditems = [];
  AddBoardItem(boarditem) {
    if (!(boarditem instanceof BoardItem))
      return;

    boarditem.entity = this;
    this.boarditems.push(boarditem);

    return this;
  }
}



//
// ValueEntity
//

class ValueEntity extends Entity {
  publics = ['value', 'lastvaluetime', 'lastchangetime'];
  emits = {
    update: 'entity, value',
    change: 'entity, value, originalvalue',
  };
  value = null;
  lastvaluetime = null;
  lastchangetime = null;
  toString() { return this.value; }
  SetValue(value) {
    const originalvalue = this.value;

    this.value = value;
    this.lastvaluetime = new Date().getTime();
    this.emit('update', this, value);

    if (originalvalue != value) {
      this.lastchangetime = new Date().getTime();
      this.emit('change', this, value, originalvalue);
    }
  }
}

class NumericValueEntity extends ValueEntity {
  value = 0;
  unit = null;
  changetolerance = 0;
  lowwarninglevel = null;
  lowerrorlevel = null;
  highwarninglevel = null;
  higherrorlevel = null;
  toString() { return this.toValueString(); }

  InitUnit(unit) {
    this.unit = (unit || "").trim();
    return this;
  }
  InitLowLevels(warninglevel, errorlevel) {
    this.lowwarninglevel = warninglevel;
    this.lowerrorlevel = errorlevel;
    return this;
  }
  InitHighLevels(warninglevel, errorlevel) {
    this.highwarninglevel = warninglevel;
    this.higherrorlevel = errorlevel;
    return this;
  }

  SetValue(value) {
    const originalvalue = this.value;

    this.value = value;
    this.lastvaluetime = new Date().getTime();
    DeviceTelemetry.Insert(this.device.id, this.code, value);
    this.emit('update', this, value);

    if (Math.abs(originalvalue - value) >= this.changetolerance) {
      this.lastchangetime = new Date().getTime();
      this.emit('change', this, value, originalvalue);
    }
  }

  toValueString() { return `${this.value} ${this.unit}`.trim(); }
  toValueColor() {
    if (this.lowerrorlevel && this.value < this.lowerrorlevel)
      return 'red';
    if (this.lowwarninglevel && this.value < this.lowwarninglevel)
      return 'orange';
    if (this.higherrorlevel && this.value > this.higherrorlevel)
      return 'red';
    if (this.highwarninglevel && this.value > this.highwarninglevel)
      return 'orange';
    return '';
  }
}

class NumericValueGaugeEntity extends NumericValueEntity {
  minvalue = Number.NEGATIVE_INFINITY;
  maxvalue = Number.POSITIVE_INFINITY;

  InitMinValue(minvalue) {
    this.minvalue = minvalue;
    return this;
  }
  InitMinValue(maxvalue) {
    this.maxvalue = maxvalue;
    return this;
  }
  InitMinMaxValue(minvalue, maxvalue) {
    this.minvalue = minvalue;
    this.maxvalue = maxvalue;
    return this;
  }
  SetValue(value) {
    if (this.minvalue > value)
      this.minvalue = value;
    if (this.maxvalue < value)
      this.maxvalue = value;
    super.SetValue(value);
  }

  toGaugeValueString() { return `${this.value} ${this.unit} (${this.minvalue}..${this.maxvalue})`.trim(); }
}

class PercentValueEntity extends NumericValueGaugeEntity {
  constructor(device, code, name, icon) {
    super(device, code, name, icon);
    this.minvalue = 0;
    this.maxvalue = 100;
    this.unit = "%";
  }
}



//
// StateEntity
//

class StateEntity extends Entity {
  publics = ['state', 'laststatetime', 'lastchangetime'];
  emits = {
    update: 'entity, state',
    change: 'entity, state, originalstate',
  };
  state = null;
  laststatetime = null;
  lastchangetime = null;
  toString() { return this.state; }
  GetState() { return this.state; }
  SetState(state, icon) {
    const originalstate = this.state;

    this.state = state;
    if (icon)
      this._icon = icon;
    this.laststatetime = new Date().getTime();
    this.emit('update', this, state);

    if (originalstate != state) {
      this.lastchangetime = new Date().getTime();
      this.emit('change', this, state, originalstate);
    }
  }
  StateToGraph(state) {
    const result = Number.parseFloat(state);
    if (!Number.isNaN(result))
      return result;
    return 0;
  }
}

class BoolStateEntity extends StateEntity {
  statenameoff = "Off";
  statenameon = "On";
  stateiconoff = null;
  stateiconon = null;
  toString() { return this.toStateString(); }

  InitStateNames(nameoff, nameon) {
    this.statenameoff = (nameoff || "").trim();
    this.statenameon = (nameon || "").trim();
    return this;
  }
  InitStateIcons(iconoff, iconon) {
    this.stateiconoff = iconoff;
    this.stateiconon = iconon;
    return this;
  }
  get icon() {
    if (this.state) { if (this.stateiconon) return this.stateiconon; }
    else { if (this.stateiconoff) return this.stateiconoff; }
    return super.icon;
  }
  Toggle() { this.SetState(!this.GetState()); }
  SetState(state) {
    super.SetState(state ? true : false);
    DeviceState.InsertSync(this.device.id, this.code, state ? "1" : "0");
  }
  toStateString() { return this.state ? this.statenameon : this.statenameoff; }
}



//
// InputEntity
//

class InputEntity extends Entity {
  publics = ['input', 'lastinputtime', 'lastchangetime'];
  emits = {
    update: 'entity, input',
    change: 'entity, input, originalinput',
  };
  input = null;
  lastinputtime = null;
  lastchangetime = null;
  toString() { return this.input; }
  GetInput() { return this.input; }
  SetInput(input, icon) {
    const originalinput = this.input;

    this.input = input;
    if (icon)
      this._icon = icon;
    this.lastinputtime = new Date().getTime();
    this.emit('input', this, input);

    if (originalinput != input) {
      this.lastchangetime = new Date().getTime();
      this.emit('change', this, input, originalinput);
    }
  }
}

class SwitchEntity extends Entity { }

class PushButtonEntity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    press: 'entity',
  };
  lastpresstime = null;
  DoPress() {
    this.lastpresstime = new Date().getTime();
    this.emit('press', this);
  }
}

class ButtonEntity extends Entity {
  publics = ['lastpresstime'];
  emits = {
    press: 'entity, clicks',
    single: 'entity',
    double: 'entity',
    triple: 'entity',
    hold: 'entity',
  };
  lastpresstime = null;
  DoPress(clicks) {
    this.lastpresstime = new Date().getTime();
    this.emit('press', this, clicks);
    switch (clicks) {
      case 1:
        DeviceEvent.InsertSync(this.device.id, this.code, 'single');
        this.emit('single', this);
        break;
      case 2:
        DeviceEvent.InsertSync(this.device.id, this.code, 'double');
        this.emit('double', this);
        break;
      case 3:
        DeviceEvent.InsertSync(this.device.id, this.code, 'triple');
        this.emit('triple', this);
        break;
      case -1:
        DeviceEvent.InsertSync(this.device.id, this.code, 'hold');
        this.emit('hold', this);
        break;
    }
  }
}

module.exports = {
  Entity,

  ValueEntity,
  NumericValueEntity,
  NumericValueGaugeEntity,
  PercentValueEntity,

  StateEntity,
  BoolStateEntity,

  InputEntity,
  SwitchEntity,
  PushButtonEntity,
  ButtonEntity,
}
