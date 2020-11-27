const dayjs = require('dayjs')

const userNotify = require('../lib/userNotify')
const ArrayUtils = require('../lib/arrayUtils')
const UserNotifyModel = require('../models/UserNotify')

const http403 = 403

module.exports = (app) => {
  app.get('/notify/list', async function (req, res, next) {
    try {
      const limit = 200

      const user = app.getUser(req)
      if (!user || !user.id) throw new Error('No user')

      UserNotifyModel.GetByUserId(user.id, limit)
        .then(notifies => {
          const notifygroups = ArrayUtils.groupByFn(
            notifies,
            (i) => dayjs(i.DateTime).format('YYYY-MM-DD'),
            {
              groupsortfn: (i) => i,
              groupsortreverse: true,
              itemsortproperty: '-DateTime'
            })

          res.render('usernotify', {
            title: 'User notifies',
            limit,
            notifygroups
          })
        })
    } catch (err) { next(err) }
  })

  app.post('/notify/read', async function (req, res, next) {
    try {
      const id = req.body.id
      const user = app.getUser(req)
      if (!user || !user.id) throw new Error('No user')

      const notify = await userNotify.read(id, user.id)
      if (!notify) throw new Error('Notify not found')
      res.send(JSON.stringify({
        subject: notify.Subject,
        message: notify.Message,
        level: notify.Level,
        icon: notify.Icon
      }))
    } catch (err) { res.status(http403).send(err.message) }
  })

  app.post('/notify/readall', async function (req, res, next) {
    try {
      const user = app.getUser(req)
      if (!user || !user.id) throw new Error('No user')

      await userNotify.readall(user.id)

      res.send('OK')
    } catch (err) { res.status(http403).send(err.message) }
  })
}
