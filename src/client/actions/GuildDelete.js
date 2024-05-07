'use strict';

const { setTimeout } = require('node:timers');
const Action = require('./Action');
const { Events } = require('../../util/Constants');
const cleanData = [
  'members',
  'presences',
  'stickers',
  'emojis',
  'invites',
  'scheduledEvents',
  'commands',
  'autoModerationRules',
  'bans',
  'stageInstances',
  'roles',
  'voiceStates',
];

class GuildDeleteAction extends Action {
  handle(data) {
    const client = this.client;

    let guild = client.guilds.resolve(data.id);
    if (guild) {
      if (data.unavailable) {
        // Guild is unavailable
        guild.available = false;

        /**
         * Emitted whenever a guild becomes unavailable, likely due to a server outage.
         * @event Client#guildUnavailable
         * @param {Guild} guild The guild that has become unavailable
         */
        client.emit(Events.GUILD_UNAVAILABLE, guild);

        // Stops the GuildDelete packet thinking a guild was actually deleted,
        // handles emitting of event itself
        return {
          guild: null,
        };
      }

      // Delete guild
      client.guilds.cache.delete(guild.id);

      /**
       * Emitted whenever a guild kicks the client or the guild is deleted/left.
       * @event Client#guildDelete
       * @param {Guild} guild The guild that was deleted
       */
      client.emit(Events.GUILD_DELETE, guild);
      setTimeout(() => this.handleDeletedServer(guild), 10_000).unref();
    }

    return { guild: guild ?? null };
  }

  handleDeletedServer(guild) {
    if (this.client.guilds.cache.has(guild.id)) {
      // If by some reason the bot gets added back within a few seconds
      // don't run the cleanCache functions on the collections.
      return;
    }
    if (guild.channels) {
      if (guild.channels.cache.size) {
        for (const key of guild.channels.cache.keys()) {
          this.client.channels._remove(key);
        }
      }
    }
    for (const value of cleanData) {
      guild[value]?.cache?.clear?.();
    }
  }
}

module.exports = GuildDeleteAction;
