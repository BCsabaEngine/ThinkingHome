const glob = require('glob')
const path = require('path')
const dayjs = require('dayjs')

module.exports = () => {
  let i = 0
  for (const file of glob.sync('./node_modules/dayjs/plugin/*.js')) {
    const filename = path.basename(file)
    const plugin = require(`dayjs/plugin/${filename}`)
    dayjs.extend(plugin)
    i++
  }
  logger.debug(`[DayJs] ${i} extensions loaded`)
}
