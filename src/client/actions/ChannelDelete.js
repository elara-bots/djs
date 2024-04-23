'use strict';

const Action = require('./Action');
const { Events } = require('../../util/Constants');

class ChannelDeleteAction extends Action {
  handle(data) {
    const client = this.client;
    const channel = client.channels.resolve(data.id);

    if (channel) {
      /**
       * Emitted whenever a channel is deleted.
       * @event Client#channelDelete
       * @param {DMChannel|GuildChannel} channel The channel that was deleted
       */
      client.emit(Events.CHANNEL_DELETE, channel);
      client.channels._remove(channel.id);
    }

    return { channel };
  }
}

module.exports = ChannelDeleteAction;
