const os = require('os');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const AdmZip = require('adm-zip');

class BackupBuilder {
  now = new Date();
  nowstr = dayjs().format('YYYY-MM-DD_HH.mm.ss.SSS');

  directory = '';
  filename = '';
  fullpath = ''
  constructor() {
    this.filename = `${os.hostname()}_${this.nowstr}.zip`;
    this.directory = path.join('./backup');
    if (!fs.existsSync(this.directory))
      fs.mkdirSync(this.directory);

    this.fullpath = path.join(this.directory, this.filename);

    fs.appendFileSync(this.fullpath, "");
  }

  RemoveOldFiles(keepcount) {
    const oldfiles = fs.readdirSync(this.directory);
    const removecount = oldfiles.length - keepcount;
    if (removecount > 0) {
      const removefiles = oldfiles.sort().slice(0, removecount);
      for (const removefile of removefiles)
        fs.unlinkSync(path.join(this.directory, removefile));
    }
    return removecount;
  }

  async CreateBackup(keepcount) {
    const backuplog = {
      starttime: new Date().getTime(),
      lines: [],

      add(line) {
        const time = new Date().getTime() - this.starttime;
        this.lines.push(`[${time.toString().padStart(7, ' ')} ms] ${line || ''}`);
      },

      getBuffer() {
        const str = this.lines.join(os.EOL);
        return Buffer.alloc(str.length, str);
      },
    }

    backuplog.add(`Backup started at ${this.nowstr} on host ${os.hostname()}`);
    backuplog.add();
    backuplog.add("Removing old files...");
    try {
      const count = this.RemoveOldFiles(keepcount);
      if (count)
        backuplog.add(`Removed ${count} file(s)`);
    }
    catch (error) {
      backuplog.add(`! Error while removing old files: ${error.message}`);
    }

    backuplog.add("Creating ZIP file...");
    const zip = new AdmZip();

    backuplog.add("Dump database...");
    try {
      const databasedump = child_process.execSync(`mysqldump -h${config.database.server} -P${config.database.port} -u${config.database.username} -p${config.database.password} ${config.database.schema}`)
      zip.addFile("database.sql", Buffer.alloc(databasedump.length, databasedump));
      backuplog.add(`Dump database OK: ${databasedump.length / 1024}kB`);
    }
    catch (error) {
      const errormsg = error.message;
      zip.addFile("!database.sql", Buffer.alloc(errormsg.length, errormsg));
      backuplog.add(`! Dump database failed: ${errormsg}`);
    }

    for (const device of runningContext.GetDevices())
      try {
        let dump = await device.DumpBackup();
        if (dump) {
          if (!Buffer.isBuffer(dump)) {
            const dumpstr = dump.toString();
            dump = Buffer.alloc(dumpstr.length, dumpstr)
          }
          zip.addFile(`device/${device.name}`, dump);
          backuplog.add(`Dump device '${device.name}' OK: ${dump.length / 1024}kB`);
        }
      }
      catch (error) {
        const errormsg = error.message;
        zip.addFile(`!device/${device.name}`, Buffer.alloc(errormsg.length, errormsg));
        backuplog.add(`! Dump device '${device.name}' failed: ${errormsg}`);
      }

    backuplog.add(`Backup finished`);
    zip.addFile("backup.log", backuplog.getBuffer());

    zip.writeZip(this.fullpath);
  }

}

module.exports = BackupBuilder;
