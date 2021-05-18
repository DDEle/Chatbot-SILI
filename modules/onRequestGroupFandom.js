const qqNumber = require('../secret/qqNumber')
const verifyQQ = require('../utils/verifyQQ')
const { koishi } = require('../index')
const bots = require('../utils/bots')

/**
 * @module Fandom群入群申请
 */
module.exports = () => {
  koishi
    .group(qqNumber.group.fandom, qqNumber.group.dftest)
    .command('ban', '', { authority: 2 })
    .option('add', '-a <user:posint>')
    .option('remove', '-r <user:posint>')
    .channelFields(['userBlacklist'])
    .action(async ({ session, options }) => {
      session.channel.userBlacklist = session.channel.userBlacklist || []

      if (options.add) {
        const user = String(options.add)
        if (session.channel.userBlacklist.includes(user)) {
          return `${user} 已位于封锁名单中。`
        } else {
          session.channel.userBlacklist.push(user)
          return `已将 ${user} 加入封锁名单。`
        }
      }

      if (options.remove) {
        const user = String(options.remove)
        if (!session.channel.userBlacklist.includes(user)) {
          return `封锁名单中没有与 ${user} 相关的记录。`
        } else {
          session.channel.userBlacklist.splice(
            session.channel.userBlacklist.indexOf(user),
            1
          )
          return `已将 ${user} 从封锁名单中移除。`
        }
      }

      return session.channel.userBlacklist.length
        ? `本群封锁名单上共有 ${
            session.channel.userBlacklist.length
          } 名用户：\n${session.channel.userBlacklist.join('、')}`
        : `哦耶，本群封锁名单上尚无记录~`
    })

  koishi
    .group(qqNumber.group.fandom, qqNumber.group.dftest)
    .on('group-member-request', async (session) => {
      // sysLog('💭', '收到入群申请', session)
      const { userId, content } = session
      const answer = content.split('答案：')[1] || ''

      // 修正用户名
      let userName = answer.trim()
      userName = userName.replace(/^user:/i, '')
      userName = userName.replace(/\s/g, '_')
      userName = userName.split('')
      var _userNameFirst = userName.shift().toUpperCase()
      userName = _userNameFirst + userName.join('')

      var command = `!verify-qq --qq ${userId} --user ${userName}`
      session.sendQueued(command)

      const { msg, status } = await verifyQQ(session, {
        qq: userId,
        user: userName,
      })

      session.sendQueued(msg)
      if (status === true) {
        try {
          await session.bot.handleGroupMemberRequest(session.messageId, true)
          session.sendQueued('已自动通过入群申请。')
        } catch (err) {
          session.sendQueued(`无法自动通过入群申请：${err}`)
        }
      } else {
        session.sendQueued(
          [
            '请手动检查该用户信息:',
            `https://community.fandom.com/wiki/Special:Lookupuser/${userName}`,
            '复制拒绝理由: QQ号验证失败，请参阅群说明',
          ].join('\n')
        )
      }
    })
}
