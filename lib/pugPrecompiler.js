const glob = require('glob');
const path = require('path');
const pug = require('pug');

function getFiles(dir) {
  let result = [];
  for (const file of glob.sync(`${dir}/*.pug`))
    result.push(file);
  for (const subdir of glob.sync(`${dir}/*/`))
    result = result.concat(getFiles(subdir));
  return result;
};

module.exports = () => {

  const starttime = new Date().getTime();

  const files = getFiles('./views');
  files.sort();

  for (const file of files)
    pug.compileFile(file, { cache: true });

  logger.info(`[Pug] ${files.length} pug file precompiled in ${(new Date().getTime() - starttime) / 1000} secs`);
}
