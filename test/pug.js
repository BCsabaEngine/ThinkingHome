module.exports = () => {
  global.app.rendertest = () => {
    console.time()
    const pug = require('pug')
    for (let i = 0; i < 100; i++) { pug.renderFile('./views/_base.pug', { /* cache: true, */ }) }
    console.timeEnd()
  }

  global.app.rendertest()
}
