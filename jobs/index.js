const glob = require('glob');
const path = require('path');

module.exports = () => {
  glob.sync('./jobs/*.js').forEach(function (file) {
    if (!file.endsWith("index.js"))
      require(path.resolve(file));
  });
}
