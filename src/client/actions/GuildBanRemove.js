'use strict';

const Action = require('./Action');
const GuildBan = require('../../structures/GuildBan');
const { Events } = require('../../util/Constants');

class GuildBanRemove extends Action {
  handle(data) {
    const client = this.client;
    const guild = client.guilds.resolve(data.guild_id);

    /**
     * Emitted whenever a member is unbanned from a guild.
     * @event Client#guildBanRemove
     * @param {GuildBan} ban The ban that was removed
     */
    if (guild) {
      const ban = guild.bans.resolve(data.user.id) ?? new GuildBan(client, data, guild);
      guild.bans.cache.delete(ban.user.id);
      client.emit(Events.GUILD_BAN_REMOVE, ban);
    }
  }
}

module.exports = GuildBanRemove;
