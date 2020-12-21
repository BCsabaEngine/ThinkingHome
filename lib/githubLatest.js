const got = require('got')

module.exports = (user, repository) => {
  const uri = `https://github.com/${user}/${repository}/releases/latest`

  return got(uri)
    .then((response) => {
      if (response.redirectUrls && response.redirectUrls.length) {
        const target = response.redirectUrls.pop()
        const match = target.match(/\/releases\/tag\/v([0-9.]*)/)
        if (match) return match[1]
      }
      return null
    })
}

/* Usage

  glv('arendst', 'Tasmota')
    .then((lastver) => {
      console.log(lastver)
    })
    .catch((err) => {
      console.log("Error occured: " + err)
    });

  (async () => {
    try {
      const lastver = await glv('arendst', 'Tasmota')
      console.log(lastver)
    }
    catch (err) {
      console.log("Error occured: " + err)
    }
  })();

*/
