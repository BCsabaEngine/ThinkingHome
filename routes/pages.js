const Pug = require('pug');
const SunCalc = require('suncalc');
const Moment = require('moment');

module.exports = (app) => {

  app.get('/', function (req, res) {
    let panels = "";
    let visibledevices = [];

    if (!systemsettings.Latitude && !systemsettings.Longitude)
      throw new Error("Coordinates are not set, Sun not available");
    const suncalc = SunCalc.getTimes(new Date(), systemsettings.Latitude, systemsettings.Longitude);
    panels += Pug.compileFile('dashboard/suntimes.pug', {})({ suncalc: suncalc, moment: Moment });

    panels +="</div><div class='row'>";

    const kert_szenzor = global.context.devices['kert_szenzor'];
    if (!kert_szenzor) throw new Error(`Device kert_szenzor not found in context`);
    visibledevices.push('kert_szenzor');
    panels += Pug.compileFile('dashboard/sensor.pug', {})({ device: kert_szenzor });

    const nappali_elol = global.context.devices['nappali_elol'];
    if (!nappali_elol) throw new Error(`Device nappali_elol not found in context`);
    visibledevices.push('nappali_elol');
    panels += Pug.compileFile('dashboard/singlelamp.pug', {})({ device: nappali_elol });

    const nappali_hatul = global.context.devices['nappali_hatul'];
    if (!nappali_hatul) throw new Error(`Device nappali_hatul not found in context`);
    visibledevices.push('nappali_hatul');
    panels += Pug.compileFile('dashboard/singlelamp.pug', {})({ device: nappali_hatul });

    const terasz_egosor = global.context.devices['terasz_egosor'];
    if (!terasz_egosor) throw new Error(`Device terasz_egosor not found in context`);
    visibledevices.push('terasz_egosor');
    panels += Pug.compileFile('dashboard/singlelamp.pug', {})({ device: terasz_egosor });

    const kertilampa_hatul = global.context.devices['kertilampa_hatul'];
    if (!kertilampa_hatul) throw new Error(`Device kertilampa_hatul not found in context`);
    visibledevices.push('kertilampa_hatul');
    panels += Pug.compileFile('dashboard/singlelamp.pug', {})({ device: kertilampa_hatul });

    const kisfahaz = global.context.devices['kisfahaz'];
    if (!kisfahaz) throw new Error(`Device kisfahaz not found in context`);
    visibledevices.push('kisfahaz');
    panels += Pug.compileFile('dashboard/twinlamp.pug', {})({ device: kisfahaz });

    res.render('main', {
      title: "Dashboard",
      panels: panels,
      visibledevices: visibledevices,
    });
  })

}
