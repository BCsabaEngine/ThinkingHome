const schedule = require('node-schedule')
const fs = require('fs')
const got = require('got')
const FormData = require('form-data')

const userNotify = require('../lib/userNotify')
const BackupBuilder = require('../lib/backupBuilder')
const SystemLogModel = require('../models/SystemLog')
const Tunnel = require('../lib/localtunnel/Tunnel')

const topicautobackup = 'Automatic backup'
const topicdyndns = 'DynDns'
const topictunnel = 'Tunnel'
const endofnight = 6
const hourminutes = 60
const randommorninghour = Math.floor(Math.random() * Math.floor(endofnight))
const randomminute = Math.floor(Math.random() * Math.floor(hourminutes))

if (!config.brainserver.server) {
  logger.warn('[Brains] No brain server set')
  return
}

async function AutoBackup() {
  try {
    if (!systemsettings.CloudToken) throw new Error('Token not set')

    const bck = new BackupBuilder()
    await bck.CreateBackup(true)

    const form = new FormData()
    form.append('token', systemsettings.CloudToken)
    form.append('backupfile', fs.createReadStream(bck.fullpath))

    const response = await got.post(config.brainserver.server + config.brainserver.backupservice, { body: form })
    let localfilesize = 0
    let remotefilesize = 0
    try {
      localfilesize = fs.statSync(bck.fullpath).size
      remotefilesize = JSON.parse(response.body).filesize
    } catch { }

    const filesizewarn = (!localfilesize || !remotefilesize || localfilesize !== remotefilesize)

    if (filesizewarn) {
      SystemLogModel.InsertWarn(topicautobackup, `Auto backup uploaded successfully, but file size problem: ${localfilesize} vs. ${remotefilesize}`)
      userNotify.addToAdmin(null, 1, 'fa fa-cloud-upload-alt', 'AutoBackup', `Auto backup uploaded successfully, but file size problem: ${localfilesize} vs. ${remotefilesize}`)
    } else {
      SystemLogModel.Insert(topicautobackup, 'Auto backup uploaded successfully')
      // userNotify.addToAdmin(null, 0, 'fa fa-cloud-upload-alt', 'AutoBackup', 'Auto backup uploaded successfully')
    }
  } catch (err) {
    SystemLogModel.InsertError(topicautobackup, `Auto backup failed: ${err.message}`)
    userNotify.addToAdmin(null, 2, 'fa fa-cloud-upload-alt', 'AutoBackup', `Auto backup failed: ${err.message}`)
  }
}

async function UpdateDynDns() {
  try {
    if (!systemsettings.CloudToken) throw new Error('Token not set')

    const form = new FormData()
    form.append('token', systemsettings.CloudToken)

    const response = await got.post(config.brainserver.server + config.brainserver.dyndnsservice, { body: form })
    let message = ''
    let updated = false
    try {
      const json = JSON.parse(response.body)
      message = json.operation
      updated = json.updated === 'true'
    } catch { }

    SystemLogModel.Insert(topicdyndns, `DNS sync completed: ${message}`)
    if (updated) {
      userNotify.addToAdmin(null, 0, 'fa fa-route', 'DNS sync', `DNS sync completed: ${message}`)
    }
  } catch (err) {
    SystemLogModel.InsertError(topicdyndns, `DNS sync failed: ${err.message}`)
    userNotify.addToAdmin(null, 2, 'fa fa-route', 'DNS sync', `DNS sync failed: ${err.message}`)
  }
}

let tunnel = null
async function UpdateTunnel() {
  try {
    if (!systemsettings.CloudToken) throw new Error('Token not set')

    if (!tunnel) {
      tunnel = new Tunnel({
        host: config.tunnelserver,
        port: 80,
        subdomain: systemsettings.CloudToken
      })

      tunnel.on('debug', (iserror, message) => {
        if (iserror) {
          logger.debug(`[Tunnel] Error: ${message}`)
        } else {
          logger.debug(`[Tunnel] Debug: ${message}`)
        }
      })

      tunnel.on('close', () => {
        logger.debug('[Tunnel] Closed')
        // delete tunnel
        tunnel = null
      })

      tunnel.on('error', async (err) => {
        logger.debug(`[Tunnel] Error: ${err}`)
        if (tunnel) {
          await tunnel.close()
        }
      })

      tunnel.open(() => {
        logger.debug(`[Tunnel] Built up on url ${tunnel.url}`)
        SystemLogModel.Insert(topictunnel, `Tunnel built up: ${tunnel.url}`)
      })
    }
  } catch (err) {
    SystemLogModel.InsertError(topictunnel, `Tunnel failed: ${err.message}`)
    // userNotify.addToAdmin(null, 2, 'fa fa-route', 'DNS sync', `DNS sync failed: ${err.message}`)
  }
}

if (config.brainserver.dyndnsservice) {
  const time = `${randomminute} */2 * * *`
  logger.info(`[Brains] UpdateDynDns scheduled as ${time}`)
  schedule.scheduleJob(time, UpdateDynDns)
}

if (config.tunnelserver) {
  const time = '*/2 * * * *'
  logger.info(`[Tunnel] UpdateTunnel scheduled as ${time}`)
  schedule.scheduleJob(time, UpdateTunnel)
}

if (config.brainserver.backupservice) {
  const time = `${hourminutes - 1 - randomminute} ${randommorninghour} * * *`
  logger.info(`[Brains] AutoBackup scheduled as ${time}`)
  schedule.scheduleJob(time, AutoBackup)
}

// setTimeout(() => {
//   //   var parser = require('cron-parser');
//   //   var interval = parser.parseExpression(`${randomminute} */2 * * *`);
//   //   console.log('Date: ', interval.next().toString());
//   //   console.log(`${randomminute} */2 * * *`)
//   //   // console.log(`${hourminutes - 1 - randomminute} ${randommorninghour} * * *`)
//   // UpdateDynDns()
//   //UpdateTunnel()
//   // AutoBackup()
// }, 3 * 1000)
