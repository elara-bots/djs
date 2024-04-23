'use strict';

const { Collection } = require('@discordjs/collection');
const GuildChannel = require('./GuildChannel');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const MessageManager = require('../managers/MessageManager');
const Permissions = require('../util/Permissions');

/**
 * Represents a voice-based guild channel on Discord.
 * @extends {GuildChannel}
 * @implements {TextBasedChannel}
 */
class BaseGuildVoiceChannel extends GuildChannel {
  constructor(guild, data, client) {
    super(guild, data, client, false);
    /**
     * A manager of the messages sent to this channel
     * @type {MessageManager}
     */
    this.messages = new MessageManager(this);

    /**
     * If the guild considers this channel NSFW
     * @type {boolean}
     */
    this.nsfw = Boolean(data.nsfw);

    this._patch(data);
  }

  _patch(data) {
    super._patch(data);

    if ('bitrate' in data) {
      /**
       * The bitrate of this voice-based channel
       * @type {number}
       */
      this.bitrate = data.bitrate;
    }

    if ('rtc_region' in data) {
      /**
       * The RTC region for this voice-based channel. This region is automatically selected if `null`.
       * @type {?string}
       */
      this.rtcRegion = data.rtc_region;
    }

    if ('user_limit' in data) {
      /**
       * The maximum amount of users allowed in this channel.
       * @type {number}
       */
      this.userLimit = data.user_limit;
    }

    if ('messages' in data) {
      for (const message of data.messages) {
        this.messages._add(message);
      }
    }

    if ('rate_limit_per_user' in data) {
      /**
       * The rate limit per user (slowmode) for this channel in seconds
       * @type {number}
       */
      this.rateLimitPerUser = data.rate_limit_per_user;
    }

    if ('nsfw' in data) {
      this.nsfw = data.nsfw;
    }

    if ('status' in data) {
      /**
       * @type {?string}
       */
      this.status = data.status;
    } else {
      this.status ??= null;
    }
  }

  /**
   * The members in this voice-based channel
   * @type {Collection<Snowflake, GuildMember>}
   * @readonly
   */
  get members() {
    const coll = new Collection();
    for (const state of this.guild.voiceStates.cache.values()) {
      if (state.channelId === this.id && state.member) {
        coll.set(state.id, state.member);
      }
    }
    return coll;
  }

  /**
   * Checks if the voice-based channel is full
   * @type {boolean}
   * @readonly
   */
  get full() {
    return this.userLimit > 0 && this.members.size >= this.userLimit;
  }

  /**
   * Whether the channel is joinable by the client user
   * @type {boolean}
   * @readonly
   */
  get joinable() {
    if (!this.viewable) return false;
    const permissions = this.permissionsFor(this.client.user);
    if (!permissions) return false;

    // This flag allows joining even if timed out
    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR, false)) return true;

    return (
      this.guild.members.me.communicationDisabledUntilTimestamp < Date.now() &&
      permissions.has(Permissions.FLAGS.CONNECT, false)
    );
  }

  /**
   * Creates an invite to this guild channel.
   * @param {CreateInviteOptions} [options={}] The options for creating the invite
   * @returns {Promise<Invite>}
   * @example
   * // Create an invite to a channel
   * channel.createInvite()
   *   .then(invite => console.log(`Created an invite with a code of ${invite.code}`))
   *   .catch(console.error);
   */
  createInvite(options) {
    return this.guild.invites.create(this.id, options);
  }

  /**
   * Fetches a collection of invites to this guild channel.
   * Resolves with a collection mapping invites by their codes.
   * @param {boolean} [cache=true] Whether or not to cache the fetched invites
   * @returns {Promise<Collection<string, Invite>>}
   */
  fetchInvites(cache = true) {
    return this.guild.invites.fetch({ channelId: this.id, cache });
  }

  // These are here only for documentation purposes - they are implemented by TextBasedChannel
  /* eslint-disable no-empty-function */
  send() {}
  sendTyping() {}
  createMessageCollector() {}
  awaitMessages() {}
  createMessageComponentCollector() {}
  awaitMessageComponent() {}
  bulkDelete() {}
  fetchWebhooks() {}
  createWebhook() {}
}

TextBasedChannel.applyToClass(BaseGuildVoiceChannel, true);

module.exports = BaseGuildVoiceChannel;
