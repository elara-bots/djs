'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class GuildScheduledEventUpdateAction extends Action {
  handle(data) {
    const client = this.client;
    const guild = client.guilds.resolve(data.guild_id);

    if (guild) {
      const oldGuildScheduledEvent = guild.scheduledEvents.resolve(data.id)?._clone() ?? null;
      const newGuildScheduledEvent = guild.scheduledEvents._add(data);

      if (!oldGuildScheduledEvent || !newGuildScheduledEvent) {
        return {};
      }
      /**
       * Emitted whenever a guild scheduled event gets updated.
       * @event Client#guildScheduledEventUpdate
       * @param {GuildScheduledEvent} oldGuildScheduledEvent The guild scheduled event object before the update
       * @param {GuildScheduledEvent} newGuildScheduledEvent The guild scheduled event object after the update
       */
      client.emit(Events.GUILD_SCHEDULED_EVENT_UPDATE, oldGuildScheduledEvent, newGuildScheduledEvent);
      if ('status' in newGuildScheduledEvent && newGuildScheduledEvent.status?.toLowerCase?.() === 'completed') {
        /**
         * If the new status is 'completed' remove it from the cache after emitting the event.
         * Otherwise the event is cached until the process gets restarted.
         */
        guild.scheduledEvents.cache.delete(data.id);
      }
      return { oldGuildScheduledEvent, newGuildScheduledEvent };
    }

    return {};
  }
}

module.exports = GuildScheduledEventUpdateAction;
