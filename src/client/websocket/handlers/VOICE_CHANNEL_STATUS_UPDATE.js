'use strict';

const { Events } = require('../../../util/Constants');

module.exports = (client, packet) => {
  const { old, updated } = client.actions.VoiceChannelStatusUpdate.handle(packet.d);
  if (old && updated) {
    /**
     * Emitted whenever a voice channel status is updated
     * @event Client#voiceChannelStatusUpdate
     * @param {BaseGuildVoiceChannel} oldChannel The channel before the update
     * @param {BaseGuildVoiceChannel} newChannel The channel after the update
     */
    client.emit(Events.VOICE_CHANNEL_STATUS_UPDATE, old, updated);
  }
};
