'use strict';

const GuildChannel = require('./GuildChannel');
const TextBasedChannel = require('./interfaces/TextBasedChannel');
const GuildTextThreadManager = require('../managers/GuildTextThreadManager');
const MessageManager = require('../managers/MessageManager');

/**
 * Represents a text-based guild channel on Discord.
 * @extends {GuildChannel}
 * @implements {TextBasedChannel}
 */
class BaseGuildTextChannel extends GuildChannel {
  constructor(guild, data, client) {
    super(guild, data, client, false);

    /**
     * A manager of the messages sent to this channel
     * @type {MessageManager}
     */
    this.messages = new MessageManager(this);

    /**
     * A manager of the threads belonging to this channel
     * @type {GuildTextThreadManager}
     */
    this.threads = new GuildTextThreadManager(this);

    /**
     * If the guild considers this channel NSFW
     * @type {boolean}
     */
    this.nsfw = Boolean(data.nsfw);

    this._patch(data);
  }

  _patch(data) {
    super._patch(data);

    if ('topic' in data) {
      /**
       * The topic of the text channel
       * @type {?string}
       */
      this.topic = data.topic;
    }

    if ('nsfw' in data) {
      this.nsfw = Boolean(data.nsfw);
    }

    if ('default_auto_archive_duration' in data) {
      /**
       * The default auto archive duration for newly created threads in this channel
       * @type {?number}
       */
      this.defaultAutoArchiveDuration = data.default_auto_archive_duration;
    }

    if ('default_thread_rate_limit_per_user' in data) {
      /**
       * The initial rate limit per user (slowmode) to set on newly created threads in a channel.
       * @type {?number}
       */
      this.defaultThreadRateLimitPerUser = data.default_thread_rate_limit_per_user;
    } else {
      this.defaultThreadRateLimitPerUser ??= null;
    }

    if ('messages' in data) {
      for (const message of data.messages) {
        this.messages._add(message);
      }
    }
  }

  /**
   * Data that can be resolved to an Application. This can be:
   * * An Application
   * * An Activity with associated Application
   * * A Snowflake
   * @typedef {Application|Snowflake} ApplicationResolvable
   */

  /**
   * Options used to create an invite to a guild channel.
   * @typedef {Object} CreateInviteOptions
   * @property {boolean} [temporary=false] Whether members that joined via the invite should be automatically
   * kicked after 24 hours if they have not yet received a role
   * @property {number} [maxAge=86400] How long the invite should last (in seconds, 0 for forever)
   * @property {number} [maxUses=0] Maximum number of uses
   * @property {boolean} [unique=false] Create a unique invite, or use an existing one with similar settings
   * @property {UserResolvable} [targetUser] The user whose stream to display for this invite,
   * required if `targetType` is 1, the user must be streaming in the channel
   * @property {ApplicationResolvable} [targetApplication] The embedded application to open for this invite,
   * required if `targetType` is 2, the application must have the `EMBEDDED` flag
   * @property {TargetType} [targetType] The type of the target for this voice channel invite
   * @property {string} [reason] The reason for creating the invite
   */

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

TextBasedChannel.applyToClass(BaseGuildTextChannel, true);

module.exports = BaseGuildTextChannel;
