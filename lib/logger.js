/* eslint-disable no-magic-numbers */
const chalk = require('chalk')

const logger =
  require('console-log-level')({
    prefix: function (level) { return chalk.grey(new Date().toLocaleString()) },
    level: process.env.LOGGER || (global.IsProduction ? 'info' : 'debug')
  })

const originalwarn = logger.warn
const originalerror = logger.error
logger.debugobj = line => { logger.debug(typeof line === 'object' ? require('util').inspect(line, false, null, true) : line) }
logger.warn = line => originalwarn(chalk.yellow(line))
logger.error = line => originalerror(chalk.red(line))

logger.version = function () {
  this.info(`[Node] ${process.version}`)
}

logger.memory = function () {
  const usage = process.memoryUsage()

  const rss = usage.rss
  const heapTotal = usage.heapTotal
  const heapUsed = usage.heapUsed
  const external = usage.external
  const arrayBuffers = usage.arrayBuffers

  this.info(`[Memory] Resident set: ${(rss / 1000 / 1000).toFixed(1)}M`)
  this.debug(`[Memory] Heap: ${(heapUsed / 1000 / 1000).toFixed(1)}M / ${(heapTotal / 1000 / 1000).toFixed(1)}M = ${(100 * heapUsed / heapTotal).toFixed(0)}%`)
  this.debug(`[Memory] External: ${(external / 1000 / 1000).toFixed(1)}M (array buf: ${(arrayBuffers / 1000 / 1000).toFixed(1)}M)`)
}

logger.resource = function () {
  const uptime = process.uptime()
  if (uptime < 10) { return }

  const usage = process.resourceUsage()

  const fsRead = usage.fsRead
  const fsWrite = usage.fsWrite
  const swappedOut = usage.swappedOut

  this.debug(`[Resource] Filesystem: ${(fsRead / uptime).toFixed(2)} read + ${(fsWrite / uptime).toFixed(2)} write /sec`)
  this.debug(`[Resource] Swap: ${(swappedOut / uptime).toFixed(2)} swap/sec`)
}

if (!global.IsProduction) {
  setInterval(() => {
    logger.resource()
    logger.memory()
  }, 60 * 1000)
}

// if (!IsProduction)
//   require('blocked-at')((time, stack, { type }) => {
//     if (stack.length)
//       logger.debug(`[Slow sync] ${time.toFixed(0)} ms of ${type} ${stack[0].trim()}`);
//   }, { threshold: 100 });

module.exports = logger
