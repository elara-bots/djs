'use strict';

const { Collection } = require('@discordjs/collection');
const CachedManager = require('./CachedManager');
const ThreadManager = require('./ThreadManager');
const { Error, TypeError } = require('../errors');
const GuildChannel = require('../structures/GuildChannel');
const PermissionOverwrites = require('../structures/PermissionOverwrites');
const ThreadChannel = require('../structures/ThreadChannel');
const Webhook = require('../structures/Webhook');
const ChannelFlags = require('../util/ChannelFlags');
const {
  ThreadChannelTypes,
  ChannelTypes,
  VideoQualityModes,
  SortOrderTypes,
  ForumLayoutTypes,
} = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const { resolveAutoArchiveMaxLimit, transformGuildForumTag, transformGuildDefaultReaction } = require('../util/Util');

/**
 * Manages API methods for GuildChannels and stores their cache.
 * @extends {CachedManager}
 */
class GuildChannelManager extends CachedManager {
  constructor(guild, iterable) {
    super(guild.client, GuildChannel, iterable);

    /**
     * The guild this Manager belongs to
     * @type {Guild}
     */
    this.guild = guild;
  }

  /**
   * The number of channels in this managers cache excluding thread channels
   * that do not count towards a guild's maximum channels restriction.
   * @type {number}
   * @readonly
   */
  get channelCountWithoutThreads() {
    return this.cache.reduce((acc, channel) => {
      if (ThreadChannelTypes.includes(channel.type)) return acc;
      return ++acc;
    }, 0);
  }

  /**
   * The cache of this Manager
   * @type {Collection<Snowflake, GuildChannel|ThreadChannel>}
   * @name GuildChannelManager#cache
   */

  _add(channel) {
    const existing = this.resolve(channel.id);
    if (existing) return existing;
    this.cache.set(channel.id, channel);
    return channel;
  }

  /**
   * Data that can be resolved to give a Guild Channel object. This can be:
   * * A GuildChannel object
   * * A ThreadChannel object
   * * A Snowflake
   * @typedef {GuildChannel|ThreadChannel|Snowflake} GuildChannelResolvable
   */

  /**
   * Resolves a GuildChannelResolvable to a Channel object.
   * @param {GuildChannelResolvable} channel The GuildChannel resolvable to resolve
   * @returns {?(GuildChannel|ThreadChannel)}
   */
  resolve(channel) {
    if (channel instanceof ThreadChannel) return super.resolve(channel.id);
    return super.resolve(channel);
  }

  /**
   * Resolves a GuildChannelResolvable to a channel id.
   * @param {GuildChannelResolvable} channel The GuildChannel resolvable to resolve
   * @returns {?Snowflake}
   */
  resolveId(channel) {
    if (channel instanceof ThreadChannel) return super.resolveId(channel.id);
    return super.resolveId(channel);
  }

  /**
   * Options used to create a new channel in a guild.
   * @typedef {CategoryCreateChannelOptions} GuildChannelCreateOptions
   * @property {CategoryChannelResolvable} [parent] Parent of the new channel
   */

  /**
   * Creates a new channel in the guild.
   * @param {string} name The name of the new channel
   * @param {GuildChannelCreateOptions} [options={}] Options for creating the new channel
   * @returns {Promise<GuildChannel>}
   * @example
   * // Create a new text channel
   * guild.channels.create('new-general', { reason: 'Needed a cool new channel' })
   *   .then(console.log)
   *   .catch(console.error);
   * @example
   * // Create a new channel with permission overwrites
   * guild.channels.create('new-voice', {
   *   type: 'GUILD_VOICE',
   *   permissionOverwrites: [
   *      {
   *        id: message.author.id,
   *        deny: [Permissions.FLAGS.VIEW_CHANNEL],
   *     },
   *   ],
   * })
   */
  async create(
    name,
    {
      type,
      topic,
      nsfw,
      bitrate,
      userLimit,
      parent,
      permissionOverwrites,
      position,
      rateLimitPerUser,
      rtcRegion,
      videoQualityMode,
      availableTags,
      defaultReactionEmoji,
      defaultSortOrder,
      defaultForumLayout,
      defaultThreadRateLimitPerUser,
      reason,
    } = {},
  ) {
    parent &&= this.client.channels.resolveId(parent);
    permissionOverwrites &&= permissionOverwrites.map(o => PermissionOverwrites.resolve(o, this.guild));
    const intType = typeof type === 'number' ? type : ChannelTypes[type] ?? ChannelTypes.GUILD_TEXT;

    const videoMode = typeof videoQualityMode === 'number' ? videoQualityMode : VideoQualityModes[videoQualityMode];

    const sortMode = typeof defaultSortOrder === 'number' ? defaultSortOrder : SortOrderTypes[defaultSortOrder];

    const layoutMode =
      typeof defaultForumLayout === 'number' ? defaultForumLayout : ForumLayoutTypes[defaultForumLayout];

    const data = await this.client.api.guilds(this.guild.id).channels.post({
      data: {
        name,
        topic,
        type: intType,
        nsfw,
        bitrate,
        user_limit: userLimit,
        parent_id: parent,
        position,
        permission_overwrites: permissionOverwrites,
        rate_limit_per_user: rateLimitPerUser,
        rtc_region: rtcRegion,
        video_quality_mode: videoMode,
        available_tags: availableTags?.map(availableTag => transformGuildForumTag(availableTag)),
        default_reaction_emoji: defaultReactionEmoji && transformGuildDefaultReaction(defaultReactionEmoji),
        default_sort_order: sortMode,
        default_forum_layout: layoutMode,
        default_thread_rate_limit_per_user: defaultThreadRateLimitPerUser,
      },
      reason,
    });
    return this.client.actions.ChannelCreate.handle(data).channel;
  }

  /**
   * Creates a webhook for the channel.
   * @param {GuildChannelResolvable} channel The channel to create the webhook for
   * @param {string} name The name of the webhook
   * @param {ChannelWebhookCreateOptions} [options] Options for creating the webhook
   * @returns {Promise<Webhook>} Returns the created Webhook
   * @example
   * // Create a webhook for the current channel
   * guild.channels.createWebhook('222197033908436994', 'Snek', {
   *   avatar: 'https://i.imgur.com/mI8XcpG.jpg',
   *   reason: 'Needed a cool new Webhook'
   * })
   *   .then(console.log)
   *   .catch(console.error)
   */
  async createWebhook(channel, name, { avatar, reason } = {}) {
    const id = this.resolveId(channel);
    if (!id) throw new TypeError('INVALID_TYPE', 'channel', 'GuildChannelResolvable');
    if (typeof avatar === 'string' && !avatar.startsWith('data:')) {
      avatar = await DataResolver.resolveImage(avatar);
    }
    const data = await this.client.api.channels[id].webhooks.post({
      data: {
        name,
        avatar,
      },
      reason,
    });
    return new Webhook(this.client, data);
  }

  /**
   * Adds the target channel to a channel's followers.
   * @param {NewsChannel|Snowflake} channel The channel to follow
   * @param {TextChannelResolvable} targetChannel The channel where published announcements will be posted at
   * @param {string} [reason] Reason for creating the webhook
   * @returns {Promise<Snowflake>} Returns created target webhook id.
   */
  async addFollower(channel, targetChannel, reason) {
    const channelId = this.resolveId(channel);
    const targetChannelId = this.resolveId(targetChannel);
    if (!channelId || !targetChannelId) throw new Error('GUILD_CHANNEL_RESOLVE');
    const { webhook_id } = await this.client.api.channels[channelId].followers.post({
      data: { webhook_channel_id: targetChannelId },
      reason,
    });
    return webhook_id;
  }

  /**
   * The data for a guild channel.
   * @typedef {Object} ChannelData
   * @property {string} [name] The name of the channel
   * @property {ChannelType} [type] The type of the channel (only conversion between text and news is supported)
   * @property {number} [position] The position of the channel
   * @property {string} [topic] The topic of the text channel
   * @property {boolean} [nsfw] Whether the channel is NSFW
   * @property {number} [bitrate] The bitrate of the voice channel
   * @property {number} [userLimit] The user limit of the voice channel
   * @property {?CategoryChannelResolvable} [parent] The parent of the channel
   * @property {boolean} [lockPermissions]
   * Lock the permissions of the channel to what the parent's permissions are
   * @property {OverwriteResolvable[]|Collection<Snowflake, OverwriteResolvable>} [permissionOverwrites]
   * Permission overwrites for the channel
   * @property {number} [rateLimitPerUser] The rate limit per user (slowmode) for the channel in seconds
   * @property {ThreadAutoArchiveDuration} [defaultAutoArchiveDuration]
   * The default auto archive duration for all new threads in this channel
   * @property {?string} [rtcRegion] The RTC region of the channel
   * @property {?VideoQualityMode|number} [videoQualityMode] The camera video quality mode of the channel
   * @property {ChannelFlagsResolvable} [flags] The flags to set on the channel
   * @property {GuildForumTagData[]} [availableTags] The tags to set as available in a forum channel
   * @property {?DefaultReactionEmoji} [defaultReactionEmoji] The emoji to set as the default reaction emoji
   * @property {number} [defaultThreadRateLimitPerUser] The rate limit per user (slowmode) to set on forum posts
   * @property {?SortOrderType} [defaultSortOrder] The default sort order mode to set on the channel
   */

  /**
   * Edits the channel.
   * @param {GuildChannelResolvable} channel The channel to edit
   * @param {ChannelData} data The new data for the channel
   * @param {string} [reason] Reason for editing this channel
   * @returns {Promise<GuildChannel>}
   * @example
   * // Edit a channel
   * guild.channels.edit('222197033908436994', { name: 'new-channel' })
   *   .then(console.log)
   *   .catch(console.error);
   */
  async edit(channel, data, reason) {
    channel = this.resolve(channel);
    if (!channel) throw new TypeError('INVALID_TYPE', 'channel', 'GuildChannelResolvable');

    const parent = data.parent && this.client.channels.resolveId(data.parent);

    let permission_overwrites = data.permissionOverwrites?.map(o => PermissionOverwrites.resolve(o, this.guild));

    if (data.lockPermissions) {
      if (parent) {
        const newParent = this.guild.channels.resolve(parent);
        if (newParent?.type === 'GUILD_CATEGORY') {
          permission_overwrites = newParent.permissionOverwrites.cache.map(o =>
            PermissionOverwrites.resolve(o, this.guild),
          );
        }
      } else if (channel.parent) {
        permission_overwrites = channel.parent.permissionOverwrites.cache.map(o =>
          PermissionOverwrites.resolve(o, this.guild),
        );
      }
    }

    let defaultAutoArchiveDuration = data.defaultAutoArchiveDuration;
    if (defaultAutoArchiveDuration === 'MAX') defaultAutoArchiveDuration = resolveAutoArchiveMaxLimit(this.guild);

    const newData = await this.client.api.channels(channel.id).patch({
      data: {
        name: (data.name ?? channel.name).trim(),
        type: data.type,
        topic: data.topic,
        nsfw: data.nsfw,
        bitrate: data.bitrate ?? channel.bitrate,
        user_limit: data.userLimit ?? channel.userLimit,
        rtc_region: 'rtcRegion' in data ? data.rtcRegion : channel.rtcRegion,
        video_quality_mode:
          typeof data.videoQualityMode === 'string' ? VideoQualityModes[data.videoQualityMode] : data.videoQualityMode,
        parent_id: parent,
        lock_permissions: data.lockPermissions,
        rate_limit_per_user: data.rateLimitPerUser,
        default_auto_archive_duration: defaultAutoArchiveDuration,
        permission_overwrites,
        available_tags: data.availableTags?.map(availableTag => transformGuildForumTag(availableTag)),
        default_reaction_emoji: data.defaultReactionEmoji && transformGuildDefaultReaction(data.defaultReactionEmoji),
        default_thread_rate_limit_per_user: data.defaultThreadRateLimitPerUser,
        flags: 'flags' in data ? ChannelFlags.resolve(data.flags) : undefined,
        default_sort_order:
          typeof data.defaultSortOrder === 'string' ? SortOrderTypes[data.defaultSortOrder] : data.defaultSortOrder,
      },
      reason,
    });

    return this.client.actions.ChannelUpdate.handle(newData).updated;
  }

  /**
   * Obtains one or more guild channels from Discord, or the channel cache if they're already available.
   * @param {Snowflake} [id] The channel's id
   * @param {BaseFetchOptions} [options] Additional options for this fetch
   * @returns {Promise<?GuildChannel|ThreadChannel|Collection<Snowflake, ?GuildChannel>>}
   * @example
   * // Fetch all channels from the guild (excluding threads)
   * message.guild.channels.fetch()
   *   .then(channels => console.log(`There are ${channels.size} channels.`))
   *   .catch(console.error);
   * @example
   * // Fetch a single channel
   * message.guild.channels.fetch('222197033908436994')
   *   .then(channel => console.log(`The channel name is: ${channel.name}`))
   *   .catch(console.error);
   */
  async fetch(id, { cache = true, force = false } = {}) {
    if (id && !force) {
      const existing = this.resolve(id);
      if (existing) return existing;
    }

    if (id) {
      const data = await this.client.api.channels(id).get();
      // Since this is the guild manager, throw if on a different guild
      if (this.guild.id !== data.guild_id) throw new Error('GUILD_CHANNEL_UNOWNED');
      return this.client.channels._add(data, this.guild, { cache });
    }

    const data = await this.client.api.guilds(this.guild.id).channels.get();
    const channels = new Collection();
    for (const channel of data) channels.set(channel.id, this.client.channels._add(channel, this.guild, { cache }));
    return channels;
  }

  /**
   * Fetches all webhooks for the channel.
   * @param {GuildChannelResolvable} channel The channel to fetch webhooks for
   * @returns {Promise<Collection<Snowflake, Webhook>>}
   * @example
   * // Fetch webhooks
   * guild.channels.fetchWebhooks('769862166131245066')
   *   .then(hooks => console.log(`This channel has ${hooks.size} hooks`))
   *   .catch(console.error);
   */
  async fetchWebhooks(channel) {
    const id = this.resolveId(channel);
    if (!id) throw new TypeError('INVALID_TYPE', 'channel', 'GuildChannelResolvable');
    const data = await this.client.api.channels[id].webhooks.get();
    return data.reduce((hooks, hook) => hooks.set(hook.id, new Webhook(this.client, hook)), new Collection());
  }

  /**
   * Obtains all active thread channels in the guild from Discord
   * @param {boolean} [cache=true] Whether to cache the fetched data
   * @returns {Promise<FetchedThreads>}
   * @example
   * // Fetch all threads from the guild
   * message.guild.channels.fetchActiveThreads()
   *   .then(fetched => console.log(`There are ${fetched.threads.size} threads.`))
   *   .catch(console.error);
   */
  async fetchActiveThreads(cache = true) {
    const raw = await this.client.api.guilds(this.guild.id).threads.active.get();
    return ThreadManager._mapThreads(raw, this.client, { guild: this.guild, cache });
  }

  /**
   * Deletes the channel.
   * @param {GuildChannelResolvable} channel The channel to delete
   * @param {string} [reason] Reason for deleting this channel
   * @returns {Promise<void>}
   * @example
   * // Delete the channel
   * guild.channels.delete('858850993013260338', 'making room for new channels')
   *   .then(console.log)
   *   .catch(console.error);
   */
  async delete(channel, reason) {
    const id = this.resolveId(channel);
    if (!id) throw new TypeError('INVALID_TYPE', 'channel', 'GuildChannelResolvable');
    await this.client.api.channels(id).delete({ reason });
  }
}

module.exports = GuildChannelManager;
