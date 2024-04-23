'use strict';

const Action = require('./Action');

class GuildChannelsPositionUpdate extends Action {
  handle(data) {
    const client = this.client;

    const guild = client.guilds.resolve(data.guild_id);
    if (guild) {
      for (const partialChannel of data.channels) {
        const channel = guild.channels.resolve(partialChannel.id);
        if (channel) channel.rawPosition = partialChannel.position;
      }
    }

    return { guild };
  }
}

module.exports = GuildChannelsPositionUpdate;
