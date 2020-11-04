const schedule = require('node-schedule')
const fs = require('fs')
const got = require('got')
const FormData = require('form-data')

const BackupBuilder = require('../lib/backupBuilder')
const SystemLogModel = require('../models/SystemLog')

const topicautobackup = 'Automatic backup'
const endofnight = 6
const randommorninghour = Math.floor(Math.random() * Math.floor(endofnight))

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

    if (filesizewarn) SystemLogModel.InsertWarn(topicautobackup, `Auto backup uploaded successfully, but file size problem: ${localfilesize} vs. ${remotefilesize}`)
    else SystemLogModel.Insert(topicautobackup, 'Auto backup uploaded successfully')
  } catch (err) { SystemLogModel.InsertError(topicautobackup, `Auto backup failed: ${err.message}`) }
}

// setTimeout(() => { AutoBackup() }, 3 * 1000)

if (config.brainserver.backupservice) schedule.scheduleJob(`0 ${randommorninghour} * * *`, AutoBackup)

if (config.brainserver.dyndnsservice) schedule.scheduleJob('0 */2 * * *', () => { /* TODO: brain.dyndns */ })
