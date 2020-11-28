const UserModel = require('../models/User')
const UserNotifyModel = require('../models/UserNotify')

module.exports = {
  async addToUser(code, user, level, icon, subject, message) {
    try {
      await UserNotifyModel.InsertSync(code, user, level, icon, subject, message)

      global.wss.BroadcastToChannel(`usernotify_${user}`)
    } catch { }
  },

  async addToAdmin(code, level, icon, subject, message) {
    const admin = await UserModel.GetAdminSync()
    if (admin) await this.addToUser(code, admin.Id, level, icon, subject, message)
  },

  async read(id, user) {
    const notify = await UserNotifyModel.MakeReadByIdSync(id, user)
    if (notify && notify.length) {
      global.wss.BroadcastToChannel(`usernotify_${user}`)
      return notify[0]
    }
    return null
  },

  async readall(user) {
    await UserNotifyModel.MakeReadAllByUserSync(user)
    global.wss.BroadcastToChannel(`usernotify_${user}`)
  }

}
