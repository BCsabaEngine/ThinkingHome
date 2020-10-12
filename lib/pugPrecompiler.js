const glob = require('glob')
const pug = require('pug')

function getFiles(dir) {
  let result = []
  for (const file of glob.sync(`${dir}/*.pug`)) { result.push(file) }
  for (const subdir of glob.sync(`${dir}/*/`)) { result = result.concat(getFiles(subdir)) }
  return result
}

module.exports = () => {
  const starttime = new Date().getTime()

  const files = getFiles('./views')
  files.sort()

  // eslint-disable-next-line no-empty
  for (const file of files) { try { pug.renderFile(file, {}) } catch { } }

  logger.info(`[Pug] ${files.length} pug file precompiled in ${(new Date().getTime() - starttime) / 1000} secs`)
}
