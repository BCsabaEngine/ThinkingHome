const fs = require('fs')
const glob = require('glob')
const path = require('path')
const favicon = require('serve-favicon')
const IpBlacklist = require('../lib/IpBlacklist')
const IpBan = require('../lib/IpBan')
const express = require('express')

const http404 = 404
const http500 = 500

module.exports = (app) => {
  app.ipblacklist = []
  app.ipbanlist = []

  if (global.IsProduction) {
    app.use(IpBlacklist.check({
      blackLists: [
        'blacklist.ips',
        'https://sslbl.abuse.ch/blacklist/sslipblacklist.txt',
        'https://sslbl.abuse.ch/blacklist/sslipblacklist_aggressive.txt'
      ],
      whiteListLifeTimeMs: 1 * 60 * 1000,
      onFailRequest: function (ipAddress) {
        if (!app.ipblacklist.includes(ipAddress)) app.ipblacklist.push(ipAddress)
        logger.warn(`[IPBlackList] Banned IP ${ipAddress}`)
        fs.appendFile('blacklist.ips', ipAddress + require('os').EOL, 'utf8', () => { })
      }
    }))

    app.use(IpBan.check({
      onBan: function (ipAddress) {
        if (!app.ipbanlist.includes(ipAddress)) app.ipbanlist.push(ipAddress)
        logger.warn(`[IPBanList] Banned IP ${ipAddress}`)
        fs.appendFile('banlist.ips', ipAddress + require('os').EOL, 'utf8', () => { })
      },
      onPermit: function (ipAddress) {
        if (!app.ipbanlist.includes(ipAddress)) app.ipbanlist = app.ipbanlist.filter(function (value) { return value !== ipAddress })
        logger.warn(`[IPBanList] Permit IP ${ipAddress}`)
      }
    }))

    app.IpBan = IpBan
  }

  if (config.web.ssl && config.web.ssl.port) {
    // Force SSL on NON local network
    // Can skip it with URI like 'nossl'
    app.use((req, res, next) => {
      if (!req.secure && !app.isLocalIp(req) && !(req.path || '').includes('nossl')) return res.redirect(['https://', req.get('Host'), req.url].join(''))
      return next()
    })
  }

  app.use(express.static('public', { index: false, maxAge: '1h', redirect: false }))
  app.use('/dist', express.static('./node_modules/admin-lte/dist', { index: false, maxAge: '1h', redirect: false }))
  app.use('/plugins', express.static('./node_modules/admin-lte/plugins', { index: false, maxAge: '1h', redirect: false }))
  app.use('/material-icons', express.static('./node_modules/material-icons', { index: false, maxAge: '1h', redirect: false }))
  app.use('/sweetalert2', express.static('./node_modules/sweetalert2/dist', { index: false, maxAge: '1h', redirect: false }))
  app.use('/mousetrap', express.static('./node_modules/mousetrap', { index: false, maxAge: '1h', redirect: false }))
  app.use('/clipboard', express.static('./node_modules/clipboard/dist', { index: false, maxAge: '1h', redirect: false }))
  app.use('/vis-network/standalone', express.static('./node_modules/vis-network/standalone', { index: false, maxAge: '1h', redirect: false }))
  app.use(favicon(path.resolve('./public/favicon.ico')))

  // early loading of important login routes in given order
  const earlyroutes = ['i18n', 'login', 'common']
  for (const earlyroute of earlyroutes) {
    require(path.resolve(`./routes/${earlyroute}.js`))(app)
  }

  // load all other route definition files
  for (const file of glob.sync('./routes/*.js')) {
    let alreadyloaded = file.endsWith('index.js')

    for (const earlyroute of earlyroutes) {
      if (file.endsWith(`${earlyroute}.js`)) {
        alreadyloaded = true
      }
    }

    if (!alreadyloaded) {
      require(path.resolve(file))(app)
    }
  }

  app.Page404 = function (req, res, next) {
    IpBan.add404(req)
    res.status(http404).render('page404', { title: 'Oops 404!' })
  }
  app.re404 = () => { app.remove(app.Page404); app.use(app.Page404) }
  app.re404()

  app.use(function (err, req, res, next) {
    logger.error(err.message)
    res.status(http500).send(err.message)
    // res.status(500).render('page500', { title: 'Oops Error!', error: err.message });
  })
}
