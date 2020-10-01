const consoleLogLevel = require('console-log-level');
const pug = require('pug');

class BoardItem {
  entity = null;

  Build(mode, name, params) { return `${mode}: ${name}`; }

  AssingConfig(config) {
    for (const key of Object.keys(config)) {
      if (!this.hasOwnProperty(key))
        throw new Error(`Invalid ${this.constructor.name} config option '${key}'`);
      this[key] = config[key];
    }
  }
}

class NumericValueGaugeBoardItem extends BoardItem {
  Build(mode, name, params) {
    if (params)
      this.AssingConfig(params);

    return pug.renderFile('./views/board/numericvaluegaugeentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
    });
  }

}

class ToggleBoardItem extends BoardItem {
  showtime = false;

  Build(mode, name, params) {
    if (params)
      this.AssingConfig(params);

    return pug.renderFile('./views/board/toggleentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      showtime: this.showtime,
    });
  }

}

class PushBoardItem extends BoardItem {

}

class PresenceBoardItem extends BoardItem {
  showtime = false;

  Build(mode, name, params) {
    if (params)
      this.AssingConfig(params);

    return pug.renderFile('./views/board/presenceentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      showtime: this.showtime,
    });
  }

}


module.exports = {
  BoardItem,

  NumericValueGaugeBoardItem,

  ToggleBoardItem,
  PushBoardItem,

  PresenceBoardItem,
}
