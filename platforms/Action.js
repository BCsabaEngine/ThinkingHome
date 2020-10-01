const EventEmitter = require('events');

class Action extends EventEmitter {
  device = null;
  entity = null;
  code = "";
  name = "";
  icon = "";
  handler = null;

  toString() { return this.name; }
  constructor(device, code, name, icon, handler) {
    super();
    this.device = device;
    this.code = code;
    this.name = name;
    this.icon = icon;
    this.handler = handler;
  }
  async Execute(actionparams) { if (this.handler) this.handler(actionparams); }
}

class ButtonAction extends Action {
}

class SelectAction extends Action {
  lookup = {};
  InitLookup(lookupobj) {
    this.lookup = JSON.stringify(lookupobj).replace(/["]/g, "\'");
    return this;
  }
}

class RangeAction extends Action {
  minvalue = 0;
  maxvalue = 0;
  InitMinMaxValue(minvalue, maxvalue) {
    this.minvalue = minvalue;
    this.maxvalue = maxvalue;
    return this;
  }
}

class CustomAction extends Action {
  onrequest = 0;
  InitOnRequest(onrequest) {
    this.onrequest = onrequest;
    return this;
  }
}

module.exports = {
  Action,

  ButtonAction,
  SelectAction,
  RangeAction,
  CustomAction,
}
