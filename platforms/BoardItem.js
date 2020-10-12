const pug = require('pug')

class BoardItem {
  entity = null;

  Build(mode, name, params) { return `${mode}: ${name}` }

  AssingConfig(config) {
    for (const key of Object.keys(config)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) {
        throw new Error(`Invalid ${this.constructor.name} config option '${key}'`)
      }
      this[key] = config[key]
    }
  }
}

class NumericValueGaugeBoardItem extends BoardItem {
  Build(mode, name, params) {
    if (params) { this.AssingConfig(params) }

    return pug.renderFile('./views/board/numericvaluegaugeentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity
    })
  }
}

class ToggleBoardItem extends BoardItem {
  icon = false;
  showtime = false;

  Build(mode, name, params) {
    if (params) { this.AssingConfig(params) }

    return pug.renderFile('./views/board/toggleentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      icon: this.icon,
      showtime: this.showtime
    })
  }
}

class OnOffBoardItem extends BoardItem {
  icon = false;

  Build(mode, name, params) {
    if (params) { this.AssingConfig(params) }

    return pug.renderFile('./views/board/onoffentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      icon: this.icon
    })
  }
}

class OnOffToggleBoardItem extends BoardItem {
  icon = false;

  Build(mode, name, params) {
    if (params) { this.AssingConfig(params) }

    return pug.renderFile('./views/board/onofftoggleentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      icon: this.icon
    })
  }
}

class BoolStateBoardItem extends BoardItem {
  showtime = false;

  Build(mode, name, params) {
    if (params) { this.AssingConfig(params) }

    return pug.renderFile('./views/board/boolstateentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      showtime: this.showtime
    })
  }
}

class PushBoardItem extends BoardItem {

}

class PresenceBoardItem extends BoardItem {
  showtime = false;

  Build(mode, name, params) {
    if (params) { this.AssingConfig(params) }

    return pug.renderFile('./views/board/presenceentity.pug', {
      mode: mode,
      name: name,
      entity: this.entity,
      showtime: this.showtime
    })
  }
}

module.exports = {
  BoardItem,

  NumericValueGaugeBoardItem,

  BoolStateBoardItem,
  OnOffBoardItem,
  OnOffToggleBoardItem,
  ToggleBoardItem,
  PushBoardItem,

  PresenceBoardItem
}
