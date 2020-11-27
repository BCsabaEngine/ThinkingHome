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
    const adminid = await UserModel.GetAdminIdSync()
    if (adminid) await this.addToUser(code, adminid, level, icon, subject, message)
  }

}
