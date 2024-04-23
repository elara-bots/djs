'use strict';

const Action = require('./Action');

class VoiceChannelStatusUpdateAction extends Action {
  handle(data) {
    const client = this.client;
    let channel = client.channels.resolve(data.id);

    if (channel) {
      const old = channel._update(data);
      return {
        old,
        updated: channel,
      };
    }

    return {};
  }
}

module.exports = VoiceChannelStatusUpdateAction;
