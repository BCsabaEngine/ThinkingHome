const os = require('os');
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
  }

  CreateBackup(keepcount) {
    this.RemoveOldFiles(keepcount);

    const zip = new AdmZip();

    const meta = `Backup created at ${this.nowstr} on host ${os.hostname()}`;
    zip.addFile("meta.inf", Buffer.alloc(meta.length, meta));

    /*
    device backup -> /devices/[name]
    // Tasmota: http://[IP]/dl
    */

    zip.writeZip(this.fullpath);
  }

}

module.exports = BackupBuilder;
