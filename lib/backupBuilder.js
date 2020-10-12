const os = require('os')
const childprocess = require('child_process')
const path = require('path')
const fs = require('fs')
const dayjs = require('dayjs')
const AdmZip = require('adm-zip')

const maxdatabasesizemb = 128

class BackupBuilder {
  now = new Date()
  nowstr = dayjs().format('YYYY-MM-DD_HH.mm.ss.SSS');

  directory = '';
  filename = '';
  fullpath = ''
  constructor() {
    this.filename = `${os.hostname()}_${this.nowstr}.zip`
    this.directory = path.join('./backup')
    if (!fs.existsSync(this.directory)) { fs.mkdirSync(this.directory) }

    this.fullpath = path.join(this.directory, this.filename)

    fs.appendFileSync(this.fullpath, '')
  }

  RemoveOldFiles(keepcount) {
    const oldfiles = fs.readdirSync(this.directory)
    const removecount = oldfiles.length - keepcount
    if (oldfiles.length > keepcount) {
      const removefiles = oldfiles.sort().slice(0, oldfiles.length - keepcount)
      for (const removefile of removefiles) { fs.unlinkSync(path.join(this.directory, removefile)) }
    }
    return removecount
  }

  async CreateBackup(keepcount) {
    const backuplog = {
      starttime: new Date().getTime(),
      lines: [],

      add(line) {
        const timepad = 7
        const time = new Date().getTime() - this.starttime
        this.lines.push(`[${time.toString().padStart(timepad, ' ')} ms] ${line || ''}`)
      },

      getBuffer() {
        const str = this.lines.join(os.EOL)
        return Buffer.alloc(str.length, str)
      }
    }

    backuplog.add(`Backup started at ${this.nowstr} on host ${os.hostname()}`)
    backuplog.add()
    backuplog.add('Removing old files...')
    try {
      const count = this.RemoveOldFiles(keepcount)
      if (count) { backuplog.add(`Removed ${count} file(s)`) }
    } catch (error) { backuplog.add(`! Error while removing old files: ${error.message}`) }

    backuplog.add('Creating ZIP file...')
    const zip = new AdmZip()

    backuplog.add('Dump database...')
    try {
      const databasedumpbuffer = childprocess.spawnSync(
        'mysqldump',
        [
          `-h${config.database.server}`,
          `-P${config.database.port}`,
          `-u${config.database.username}`,
          `-p${config.database.password}`,
          config.database.schema],
        {
          maxBuffer: maxdatabasesizemb * 1024 * 1024
        })

      if (databasedumpbuffer.error) { throw new Error(databasedumpbuffer.error.toString()) }

      if (databasedumpbuffer.stderr && databasedumpbuffer.stderr.length) { throw new Error(databasedumpbuffer.stderr.toString()) }

      if (databasedumpbuffer.stdout && databasedumpbuffer.stdout.length) {
        zip.addFile('database.sql', databasedumpbuffer.stdout)
        backuplog.add(`Dump database OK: ${Math.round(databasedumpbuffer.stdout.length / 1024)} kB`)
      }
    } catch (error) {
      const errormsg = error.message
      zip.addFile('!database.sql', Buffer.alloc(errormsg.length, errormsg))
      backuplog.add(`! Dump database failed: ${errormsg}`)
    }

    for (const device of global.runningContext.GetDevices()) {
      try {
        let dump = await device.DumpBackup()
        if (dump) {
          if (!Buffer.isBuffer(dump)) {
            const dumpstr = dump.toString()
            dump = Buffer.alloc(dumpstr.length, dumpstr)
          }
          zip.addFile(`device/${device.name}`, dump)
          backuplog.add(`Dump device '${device.name}' OK: ${Math.round(dump.length / 1024)} kB`)
        }
      } catch (error) {
        const errormsg = error.message
        zip.addFile(`!device/${device.name}`, Buffer.alloc(errormsg.length, errormsg))
        backuplog.add(`! Dump device '${device.name}' failed: ${errormsg}`)
      }
    }

    backuplog.add('Backup finished')
    zip.addFile('backup.log', backuplog.getBuffer())

    zip.writeZip(this.fullpath)
  }
}

module.exports = BackupBuilder
