const os = require('os')
const execSync = require('child_process').execSync
const path = require('path')
const fs = require('fs')
const dayjs = require('dayjs')
const AdmZip = require('adm-zip')

class BackupBuilder {
  now = new Date()
  nowstr = dayjs().format('YYYY-MM-DD_HH.mm.ss.SSS');

  directory = '';
  tempdirectory = '';
  filename = '';
  fullpath = ''
  keepcount = 0
  constructor(keepcount = 7) {
    this.filename = `${os.hostname()}_${this.nowstr}.zip`
    this.directory = path.join('./backup')
    if (!fs.existsSync(this.directory)) { fs.mkdirSync(this.directory) }
    this.tempdirectory = path.join('./backup/temp')
    if (!fs.existsSync(this.tempdirectory)) { fs.mkdirSync(this.tempdirectory) }

    this.fullpath = path.join(this.directory, this.filename)
    this.keepcount = keepcount

    fs.appendFileSync(this.fullpath, '')
  }

  RemoveOldFiles() {
    const oldfiles = fs.readdirSync(this.directory).filter(file => !['readme.md', 'temp'].includes(file))
    const removecount = oldfiles.length - this.keepcount
    if (oldfiles.length > this.keepcount) {
      const removefiles = oldfiles.sort().slice(0, oldfiles.length - this.keepcount)
      for (const removefile of removefiles) fs.unlinkSync(path.join(this.directory, removefile))
    }
    return removecount
  }

  async CreateBackup(removeoldfiles = false) {
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

    if (removeoldfiles) {
      backuplog.add('Removing old files...')
      try {
        const count = this.RemoveOldFiles()
        if (count) { backuplog.add(`Removed ${count} file(s)`) }
      } catch (error) { backuplog.add(`! Error while removing old files: ${error.message}`) }
    }

    backuplog.add('Creating ZIP file...')
    const zip = new AdmZip()

    backuplog.add('Dump database...')
    try {
      const databasebackupfile = path.join(this.tempdirectory, 'database.sql')

      if (fs.existsSync(databasebackupfile)) fs.unlinkSync(databasebackupfile)

      try {
        execSync(`mysqldump -h${config.database.server} -P${config.database.port} -u${config.database.username} -p${config.database.password} ${config.database.schema} > ${databasebackupfile}`, { stdio: 'pipe' })
      } catch (err) {
        const dumperror = err.message.match(/mysqldump:(.*)/i)
        if (dumperror) throw new Error(dumperror[1])
        throw err
      }

      if (!fs.existsSync(databasebackupfile)) throw new Error('Database dump not created')

      const dumpsize = fs.statSync(databasebackupfile).size
      if (!dumpsize) throw new Error('Database dump empty')

      zip.addLocalFile(databasebackupfile, './', 'database.sql')
      backuplog.add(`Dump database OK: ${Math.round(dumpsize / 1024 / 1024)} MB`)
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

    const backupexfolder = './backupex/'
    try {
      zip.addLocalFolder(backupexfolder, backupexfolder)
      backuplog.add('Compress backupex OK')
    } catch (error) {
      const errormsg = error.message
      zip.addFile(backupexfolder, Buffer.alloc(errormsg.length, errormsg))
      backuplog.add(`! Compress backupex failed: ${errormsg}`)
    }

    backuplog.add('Backup finished')
    zip.addFile('backup.log', backuplog.getBuffer())

    zip.writeZip(this.fullpath)
  }
}

module.exports = BackupBuilder
