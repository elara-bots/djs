'use strict';

const Action = require('./Action');

class GuildRolesPositionUpdate extends Action {
  handle(data) {
    const client = this.client;

    const guild = client.guilds.resolve(data.guild_id);
    if (guild) {
      for (const partialRole of data.roles) {
        const role = guild.roles.resolve(partialRole.id);
        if (role) role.rawPosition = partialRole.position;
      }
    }

    return { guild };
  }
}

module.exports = GuildRolesPositionUpdate;
