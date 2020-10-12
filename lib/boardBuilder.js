const YAML = require('yaml')
const pug = require('pug')

class Panel {
  type = null;
  name = null;
  color = null;
  icon = null;

  constructor(name) {
    this.name = name
  }

  AssingConfig(panelconfig) {
    for (const key of Object.keys(panelconfig)) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) {
        throw new Error(`Invalid ${this.constructor.name} config option '${key}' at panel '${this.name}'`)
      }
      this[key] = panelconfig[key]
    }
  }

  Build() { }
}

class ItemsPanel extends Panel {
  BuildItemHtmls(mode) {
    const result = []

    const devices = global.runningContext.GetDevices()
    for (const itemkey of Object.keys(this.items)) {
      const item = this.items[itemkey]
      const itemparts = item.match(/^([a-z0-9_]*).([a-z0-9]*)(\([ ]*({[ :"'\-,a-z0-9]*}[ ]*)\))?$/)
      if (!itemparts) { throw new Error(`Invalid device.entity: ${item}`) }

      const devicename = itemparts[1]
      const entitycode = itemparts[2]
      const entityparams = itemparts[4]
      // eslint-disable-next-line prefer-const
      let entityparamsobj = {}

      if (entityparams) {
        // eslint-disable-next-line no-eval
        try { eval(`entityparamsobj = ${entityparams}`) } catch (err) { throw new Error(`Invalid entity parameters: ${entityparams}`) }
      }

      const device = devices.find(i => i.name === devicename)
      if (!device) {
        logger.warn(`'${devicename}' not found, skipped`)
        continue
      }

      if (!Object.keys(device.entities).includes(entitycode)) {
        logger.warn(`'${devicename}.${entitycode}' not found, skipped`)
        continue
      }
      const entity = device.entities[entitycode]

      if (!entity.boarditems.length) {
        logger.warn(`'${devicename}.${entitycode}' has not any boarditem, skipped`)
        continue
      }
      const entityboarditem = entity.boarditems[0]

      if (entityboarditem) {
        try {
          const itemhtml = entityboarditem.Build(mode, itemkey, entityparamsobj)
          result.push(itemhtml)
        } catch (error) {
          logger.error(error)
          throw new Error(`'${devicename}.${entitycode}' boarditem build failed: ${error.message}`)
        }
      }
    }

    return result
  }
}
class ListPanel extends ItemsPanel {
  items = [];

  Build() {
    const itemhtmls = this.BuildItemHtmls('list')

    return pug.renderFile('./views/board/listpanel.pug', {
      name: this.name,
      color: this.color,
      icon: this.icon,
      items: itemhtmls
    })
  }
}
class GroupPanel extends ItemsPanel {
  items = [];

  Build() {
    const itemhtmls = this.BuildItemHtmls('group')

    return pug.renderFile('./views/board/grouppanel.pug', {
      name: this.name,
      color: this.color,
      icon: this.icon,
      items: itemhtmls
    })
  }
}
class SinglePanel extends ItemsPanel {
  items = [];

  Build() {
    const itemhtmls = this.BuildItemHtmls('single')

    return pug.renderFile('./views/board/singlepanel.pug', {
      name: this.name,
      color: this.color,
      icon: this.icon,
      items: itemhtmls
    })
  }
}

class BoardBuilder {
  yamlobj = null;

  constructor(yaml) { this.yamlobj = YAML.parse(yaml) || {} }

  Build() {
    const maxcolumncount = 3
    const columncount = Math.min(this.GetPanelNames().length, maxcolumncount)

    const columns = []
    for (let i = 0; i < columncount; i++) { columns.push([]) }

    let currindex = 0
    for (const name of this.GetPanelNames()) {
      columns[currindex].push(this.BuildPanel(name))

      currindex++
      if (currindex >= columncount) { currindex = 0 }
    }

    return pug.renderFile('./views/board/board.pug', { columns: columns })
  }

  GetPanelNames() { return Object.keys(this.yamlobj) }

  BuildPanel(panelname) {
    let panelobj = null

    const panelconfig = this.yamlobj[panelname]
    if (panelconfig) {
      switch (panelconfig.type) {
        case 'list':
          panelobj = new ListPanel(panelname)
          break
        case 'group':
          panelobj = new GroupPanel(panelname)
          break
        case 'single':
          panelobj = new SinglePanel(panelname)
          break
        // case "weather":
        //   panelobj = new WeatherPanel();
        //   break;
        // case "sun":
        //   panelobj = new SunPanel();
        //   break;
        default:
          if (panelconfig.type) {
            throw new Error(`Invalid panel type '${panelconfig.type}' at panel '${panelname}'`)
          } else {
            throw new Error(`Panel type not set at panel '${panelname}'`)
          }
      }
    }

    if (!panelobj) { return '' }

    panelobj.AssingConfig(panelconfig)
    return panelobj.Build()
  }
}

module.exports = BoardBuilder
