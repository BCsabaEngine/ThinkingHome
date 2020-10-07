const fs = require('fs');
const path = require('path');
const express = require('express');
const PlatformSettingModel = require('../models/PlatformSetting');

class Platform {
  approuter = express.Router();
  setting = {
    toDisplayList: function () { return {} }.bind(this),
  };
  devices = [];
  async Start() {
    await this.ReadSettings();

    this.approuter.post('/setting/update', this.WebSettingUpdate.bind(this));
    this.approuter.post('/setting/toggle', this.WebSettingToggle.bind(this));
    this.approuter.post('/setting/delete', this.WebSettingDelete.bind(this));
  }
  async Stop() {
    for (const device of this.devices)
      await device.Stop();
    this.devices = [];
    logger.info(`[Platform] ${this.constructor.name} stopped`);
  }
  async WebSettingUpdate(req, res, next) {
    await this.AdaptSetting(req.body.name, req.body.value);
    res.send("OK");
  }
  async WebSettingToggle(req, res, next) {
    await this.ToggleSetting(req.body.name);
    res.send("OK");
  }
  async WebSettingDelete(req, res, next) {
    await this.AdaptSetting(req.body.name, null);
    res.send("OK");
  }

  async ReadSettings() {
    const settingread = await PlatformSettingModel.GetSettingsSync(this.GetCode());
    for (const key of Object.keys(settingread).filter(key => key in this.setting))
      this.setting[key] = settingread[key];
  }
  async AdaptSetting(name, value) {
    const keys = Object.keys(this.setting);
    if (keys.includes(name)) {
      this.setting[name] = value ? value : null;
      await this.WriteSetting(name, value);
    }
  }
  async ToggleSetting(name) {
    const keys = Object.keys(this.setting);
    if (keys.includes(name)) {
      this.setting[name] = this.setting[name] ? false : true;
      await this.WriteSetting(name, this.setting[name]);
    }
  }
  async WriteSetting(name, value) {
    await PlatformSettingModel.UpdateSettingSync(this.GetCode(), name, value);
  }
  async WriteSettings() {
    await PlatformSettingModel.UpdateSettingsSync(this.GetCode(), this.setting);
  }

  GetDeviceCount() { return this.devices.length; }
  GetStatusInfos() {
    let result = [];
    for (const device of this.devices) {
      const statusinfos = device.GetStatusInfos();
      if (Array.isArray(statusinfos))
        result = result.concat(statusinfos);
    }
    return result;
  }
  Tick(seconds) { /*for (const device of this.devices) device.Tick(seconds);*/ }

  static GetAvailablePlatforms() {
    const result = [];
    const cwd = 'platforms';
    for (const dirent of fs.readdirSync(cwd, { withFileTypes: true }))
      if (dirent.isDirectory())
        for (const subdirent of fs.readdirSync(path.join(cwd, dirent.name), { withFileTypes: true }))
          if (subdirent.isFile() && subdirent.name.endsWith("Platform.js")) {
            const platform = require(`./${dirent.name}/${subdirent.name}`);
            result.push({
              priority: platform.GetPriority(),
              code: platform.GetCode(),
              name: platform.GetName(),
              handlercount: platform.GetHandlerCount(),
              require: () => { return require("./" + path.join(dirent.name, subdirent.name)) },
            });
          }
    result.sort(function (a, b) { return a.priority - b.priority; });
    return result;
  }
  GetCode() { return Platform.GetCode(); }
  GetName() { return Platform.GetName(); }
  GetDescription() { return Platform.GetDescription(); }
  static GetPriority() { return 0 }
  static GetCode() { return '' }
  static GetName() { return '' }
  static GetDescription() { return '' }
  static GetHandlerCount() { return 0 }
}
module.exports = Platform;