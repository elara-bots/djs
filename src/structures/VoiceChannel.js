'use strict';

const process = require('node:process');
const BaseGuildVoiceChannel = require('./BaseGuildVoiceChannel');
const Permissions = require('../util/Permissions');

let deprecationEmittedForEditable = false;

/**
 * Represents a guild voice channel on Discord.
 * @extends {BaseGuildVoiceChannel}
 */
class VoiceChannel extends BaseGuildVoiceChannel {
  /**
   * Whether the channel is editable by the client user
   * @type {boolean}
   * @readonly
   * @deprecated Use {@link VoiceChannel#manageable} instead
   */
  get editable() {
    if (!deprecationEmittedForEditable) {
      process.emitWarning(
        'The VoiceChannel#editable getter is deprecated. Use VoiceChannel#manageable instead.',
        'DeprecationWarning',
      );

      deprecationEmittedForEditable = true;
    }

    return this.manageable;
  }

  /**
   * Whether the channel is joinable by the client user
   * @type {boolean}
   * @readonly
   */
  get joinable() {
    if (!super.joinable) return false;
    if (this.full && !this.permissionsFor(this.client.user).has(Permissions.FLAGS.MOVE_MEMBERS, false)) return false;
    return true;
  }

  /**
   * Checks if the client has permission to send audio to the voice channel
   * @type {boolean}
   * @readonly
   */
  get speakable() {
    const permissions = this.permissionsFor(this.client.user);
    if (!permissions) return false;
    // This flag allows speaking even if timed out
    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR, false)) return true;

    return (
      this.guild.members.me.communicationDisabledUntilTimestamp < Date.now() &&
      permissions.has(Permissions.FLAGS.SPEAK, false)
    );
  }
}

module.exports = VoiceChannel;
