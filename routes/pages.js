const Pug = require('pug');
const device = require('./device');
module.exports = (app) => {

  app.get('/', function (req, res) {
    let panels = "";
    let visibledevices = [];

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
