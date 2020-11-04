const glob = require('glob')
const path = require('path')

module.exports = () => {
  for (const file of glob.sync('./jobs/*.js')) {
    if (!file.endsWith('index.js')) require(path.resolve(file))
  }
}
