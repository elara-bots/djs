'use strict';

const { Collection } = require('@discordjs/collection');
const AnonymousGuild = require('./AnonymousGuild');
const GuildAuditLogs = require('./GuildAuditLogs');
const Integration = require('./Integration');
const Webhook = require('./Webhook');
const { Error } = require('../errors');
const AutoModerationRuleManager = require('../managers/AutoModerationRuleManager');
const GuildApplicationCommandManager = require('../managers/GuildApplicationCommandManager');
const GuildBanManager = require('../managers/GuildBanManager');
const GuildChannelManager = require('../managers/GuildChannelManager');
const GuildEmojiManager = require('../managers/GuildEmojiManager');
const GuildInviteManager = require('../managers/GuildInviteManager');
const GuildMemberManager = require('../managers/GuildMemberManager');
const GuildScheduledEventManager = require('../managers/GuildScheduledEventManager');
const GuildStickerManager = require('../managers/GuildStickerManager');
const PresenceManager = require('../managers/PresenceManager');
const RoleManager = require('../managers/RoleManager');
const StageInstanceManager = require('../managers/StageInstanceManager');
const VoiceStateManager = require('../managers/VoiceStateManager');
const {
  ChannelTypes,
  DefaultMessageNotificationLevels,
  VerificationLevels,
  ExplicitContentFilterLevels,
  Status,
  MFALevels,
  PremiumTiers,
} = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
const SystemChannelFlags = require('../util/SystemChannelFlags');
const Util = require('../util/Util');

/**
 * Represents a guild (or a server) on Discord.
 * <info>It's recommended to see if a guild is available before performing operations or reading data from it. You can
 * check this with {@link Guild#available}.</info>
 * @extends {AnonymousGuild}
 */
class Guild extends AnonymousGuild {
  constructor(client, data) {
    super(client, data, false);

    this.deleted = false;

    /**
     * A manager of the application commands belonging to this guild
     * @type {GuildApplicationCommandManager}
     */
    this.commands = new GuildApplicationCommandManager(this);

    /**
     * A manager of the members belonging to this guild
     * @type {GuildMemberManager}
     */
    this.members = new GuildMemberManager(this);

    /**
     * A manager of the channels belonging to this guild
     * @type {GuildChannelManager}
     */
    this.channels = new GuildChannelManager(this);

    /**
     * A manager of the bans belonging to this guild
     * @type {GuildBanManager}
     */
    this.bans = new GuildBanManager(this);

    /**
     * A manager of the roles belonging to this guild
     * @type {RoleManager}
     */
    this.roles = new RoleManager(this);

    /**
     * A manager of the presences belonging to this guild
     * @type {PresenceManager}
     */
    this.presences = new PresenceManager(this.client);

    /**
     * A manager of the voice states of this guild
     * @type {VoiceStateManager}
     */
    this.voiceStates = new VoiceStateManager(this);

    /**
     * A manager of the stage instances of this guild
     * @type {StageInstanceManager}
     */
    this.stageInstances = new StageInstanceManager(this);

    /**
     * A manager of the invites of this guild
     * @type {GuildInviteManager}
     */
    this.invites = new GuildInviteManager(this);

    /**
     * A manager of the scheduled events of this guild
     * @type {GuildScheduledEventManager}
     */
    this.scheduledEvents = new GuildScheduledEventManager(this);

    /**
     * A manager of the auto moderation rules of this guild.
     * @type {AutoModerationRuleManager}
     */
    this.autoModerationRules = new AutoModerationRuleManager(this);

    if (!data) return;
    if (data.unavailable) {
      /**
       * Whether the guild is available to access. If it is not available, it indicates a server outage
       * @type {boolean}
       */
      this.available = false;
    } else {
      this._patch(data);
      if (!data.channels) this.available = false;
    }

    /**
     * The id of the shard this Guild belongs to.
     * @type {number}
     */
    this.shardId = data.shardId;
  }

  /**
   * The Shard this Guild belongs to.
   * @type {WebSocketShard}
   * @readonly
   */
  get shard() {
    return this.client.ws.shards.get(this.shardId);
  }

  _patch(data) {
    super._patch(data);
    this.id = data.id;
    if ('name' in data) this.name = data.name;
    if ('icon' in data) this.icon = data.icon;
    if ('unavailable' in data) {
      this.available = !data.unavailable;
    } else {
      this.available ??= true;
    }

    if ('discovery_splash' in data) {
      /**
       * The hash of the guild discovery splash image
       * @type {?string}
       */
      this.discoverySplash = data.discovery_splash;
    }

    if ('member_count' in data) {
      /**
       * The full amount of members in this guild
       * @type {number}
       */
      this.memberCount = data.member_count;
    }

    if ('large' in data) {
      /**
       * Whether the guild is "large" (has more than {@link WebsocketOptions large_threshold} members, 50 by default)
       * @type {boolean}
       */
      this.large = Boolean(data.large);
    }

    if ('premium_progress_bar_enabled' in data) {
      /**
       * Whether this guild has its premium (boost) progress bar enabled
       * @type {boolean}
       */
      this.premiumProgressBarEnabled = data.premium_progress_bar_enabled;
    }

    /**
     * An array of enabled guild features, here are the possible values:
     * * ANIMATED_ICON
     * * AUTO_MODERATION
     * * BANNER
     * * COMMERCE
     * * COMMUNITY
     * * CREATOR_MONETIZABLE_PROVISIONAL
     * * CREATOR_STORE_PAGE
     * * DISCOVERABLE
     * * FEATURABLE
     * * INVITES_DISABLED
     * * INVITE_SPLASH
     * * MEMBER_VERIFICATION_GATE_ENABLED
     * * NEWS
     * * PARTNERED
     * * PREVIEW_ENABLED
     * * VANITY_URL
     * * VERIFIED
     * * VIP_REGIONS
     * * WELCOME_SCREEN_ENABLED
     * * TICKETED_EVENTS_ENABLED
     * * MONETIZATION_ENABLED
     * <warn>`MONETIZATION_ENABLED` has been replaced.
     * See [this pull request](https://github.com/discord/discord-api-docs/pull/5724) for more information.</warn>
     * * MORE_STICKERS
     * * THREE_DAY_THREAD_ARCHIVE
     * * SEVEN_DAY_THREAD_ARCHIVE
     * * PRIVATE_THREADS
     * * ROLE_ICONS
     * * RAID_ALERTS_DISABLED
     * * ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE
     * * ROLE_SUBSCRIPTIONS_ENABLED
     * @typedef {string} Features
     * @see {@link https://discord.com/developers/docs/resources/guild#guild-object-guild-features}
     */

    if ('application_id' in data) {
      /**
       * The id of the application that created this guild (if applicable)
       * @type {?Snowflake}
       */
      this.applicationId = data.application_id;
    }

    if ('afk_timeout' in data) {
      /**
       * The time in seconds before a user is counted as "away from keyboard"
       * @type {?number}
       */
      this.afkTimeout = data.afk_timeout;
    }

    if ('afk_channel_id' in data) {
      /**
       * The id of the voice channel where AFK members are moved
       * @type {?Snowflake}
       */
      this.afkChannelId = data.afk_channel_id;
    }

    if ('system_channel_id' in data) {
      /**
       * The system channel's id
       * @type {?Snowflake}
       */
      this.systemChannelId = data.system_channel_id;
    }

    if ('premium_tier' in data) {
      /**
       * The premium tier of this guild
       * @type {PremiumTier}
       */
      this.premiumTier = PremiumTiers[data.premium_tier];
    }

    if ('widget_enabled' in data) {
      /**
       * Whether widget images are enabled on this guild
       * @type {?boolean}
       */
      this.widgetEnabled = data.widget_enabled;
    }

    if ('widget_channel_id' in data) {
      /**
       * The widget channel's id, if enabled
       * @type {?string}
       */
      this.widgetChannelId = data.widget_channel_id;
    }

    if ('explicit_content_filter' in data) {
      /**
       * The explicit content filter level of the guild
       * @type {ExplicitContentFilterLevel}
       */
      this.explicitContentFilter = ExplicitContentFilterLevels[data.explicit_content_filter];
    }

    if ('mfa_level' in data) {
      /**
       * The required MFA level for this guild
       * @type {MFALevel}
       */
      this.mfaLevel = MFALevels[data.mfa_level];
    }

    if ('joined_at' in data) {
      /**
       * The timestamp the client user joined the guild at
       * @type {number}
       */
      this.joinedTimestamp = new Date(data.joined_at).getTime();
    }

    if ('default_message_notifications' in data) {
      /**
       * The default message notification level of the guild
       * @type {DefaultMessageNotificationLevel}
       */
      this.defaultMessageNotifications = DefaultMessageNotificationLevels[data.default_message_notifications];
    }

    if ('system_channel_flags' in data) {
      /**
       * The value set for the guild's system channel flags
       * @type {Readonly<SystemChannelFlags>}
       */
      this.systemChannelFlags = new SystemChannelFlags(data.system_channel_flags).freeze();
    }

    if ('max_members' in data) {
      /**
       * The maximum amount of members the guild can have
       * @type {?number}
       */
      this.maximumMembers = data.max_members;
    } else {
      this.maximumMembers ??= null;
    }

    if ('max_presences' in data) {
      /**
       * The maximum amount of presences the guild can have
       * <info>You will need to fetch the guild using {@link Guild#fetch} if you want to receive this parameter</info>
       * @type {?number}
       */
      this.maximumPresences = data.max_presences ?? 25_000;
    } else {
      this.maximumPresences ??= null;
    }

    if ('max_video_channel_users' in data) {
      /**
       * The maximum amount of users allowed in a video channel.
       * @type {?number}
       */
      this.maxVideoChannelUsers = data.max_video_channel_users;
    } else {
      this.maxVideoChannelUsers ??= null;
    }

    if ('approximate_member_count' in data) {
      /**
       * The approximate amount of members the guild has
       * <info>You will need to fetch the guild using {@link Guild#fetch} if you want to receive this parameter</info>
       * @type {?number}
       */
      this.approximateMemberCount = data.approximate_member_count;
    } else {
      this.approximateMemberCount ??= null;
    }

    if ('approximate_presence_count' in data) {
      /**
       * The approximate amount of presences the guild has
       * <info>You will need to fetch the guild using {@link Guild#fetch} if you want to receive this parameter</info>
       * @type {?number}
       */
      this.approximatePresenceCount = data.approximate_presence_count;
    } else {
      this.approximatePresenceCount ??= null;
    }

    /**
     * The use count of the vanity URL code of the guild, if any
     * <info>You will need to fetch this parameter using {@link Guild#fetchVanityData} if you want to receive it</info>
     * @type {?number}
     */
    this.vanityURLUses ??= null;

    if ('rules_channel_id' in data) {
      /**
       * The rules channel's id for the guild
       * @type {?Snowflake}
       */
      this.rulesChannelId = data.rules_channel_id;
    }

    if ('public_updates_channel_id' in data) {
      /**
       * The community updates channel's id for the guild
       * @type {?Snowflake}
       */
      this.publicUpdatesChannelId = data.public_updates_channel_id;
    }

    if ('preferred_locale' in data) {
      /**
       * The preferred locale of the guild, defaults to `en-US`
       * @type {Locale}
       * @see {@link https://discord.com/developers/docs/reference#locales}
       */
      this.preferredLocale = data.preferred_locale;
    }

    if ('safety_alerts_channel_id' in data) {
      /**
       * The safety alerts channel's id for the guild
       * @type {?Snowflake}
       */
      this.safetyAlertsChannelId = data.safety_alerts_channel_id;
    } else {
      this.safetyAlertsChannelId ??= null;
    }

    if (data.channels) {
      this.channels.cache.clear();
      for (const rawChannel of data.channels) {
        this.client.channels._add(rawChannel, this);
      }
    }

    if (data.threads) {
      for (const rawThread of data.threads) {
        this.client.channels._add(rawThread, this);
      }
    }

    if (data.roles) {
      this.roles.cache.clear();
      for (const role of data.roles) this.roles._add(role);
    }

    if (data.members) {
      this.members.cache.clear();
      for (const guildUser of data.members) this.members._add(guildUser);
    }

    if ('owner_id' in data) {
      /**
       * The user id of this guild's owner
       * @type {Snowflake}
       */
      this.ownerId = data.owner_id;
    }
    if (this.client.options?.handlePresenceUpdates !== false) {
      // If handlePresenceUpdates isn't false then add the presences to the cache.
      if (data.presences) {
        for (const presence of data.presences) {
          this.presences._add(Object.assign(presence, { guild: this }));
        }
      }
    }

    if (data.stage_instances) {
      this.stageInstances.cache.clear();
      for (const stageInstance of data.stage_instances) {
        this.stageInstances._add(stageInstance);
      }
    }

    if (data.guild_scheduled_events) {
      this.scheduledEvents.cache.clear();
      for (const scheduledEvent of data.guild_scheduled_events) {
        this.scheduledEvents._add(scheduledEvent);
      }
    }

    if (data.voice_states) {
      this.voiceStates.cache.clear();
      for (const voiceState of data.voice_states) {
        this.voiceStates._add(voiceState);
      }
    }

    if (!this.emojis) {
      /**
       * A manager of the emojis belonging to this guild
       * @type {GuildEmojiManager}
       */
      this.emojis = new GuildEmojiManager(this);
      if (data.emojis) for (const emoji of data.emojis) this.emojis._add(emoji);
    } else if (data.emojis) {
      this.client.actions.GuildEmojisUpdate.handle({
        guild_id: this.id,
        emojis: data.emojis,
      });
    }

    if (!this.stickers) {
      /**
       * A manager of the stickers belonging to this guild
       * @type {GuildStickerManager}
       */
      this.stickers = new GuildStickerManager(this);
      if (data.stickers) for (const sticker of data.stickers) this.stickers._add(sticker);
    } else if (data.stickers) {
      this.client.actions.GuildStickersUpdate.handle({
        guild_id: this.id,
        stickers: data.stickers,
      });
    }
  }

  /**
   * The time the client user joined the guild
   * @type {Date}
   * @readonly
   */
  get joinedAt() {
    return new Date(this.joinedTimestamp);
  }

  /**
   * The URL to this guild's discovery splash image.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  discoverySplashURL({ format, size } = {}) {
    return this.discoverySplash && this.client.rest.cdn.DiscoverySplash(this.id, this.discoverySplash, format, size);
  }

  /**
   * Fetches the owner of the guild.
   * If the member object isn't needed, use {@link Guild#ownerId} instead.
   * @param {BaseFetchOptions} [options] The options for fetching the member
   * @returns {Promise<GuildMember>}
   */
  fetchOwner(options) {
    return this.members.fetch({ ...options, user: this.ownerId });
  }

  /**
   * The client user as a GuildMember of this guild
   * @type {?GuildMember}
   * @readonly
   */
  get me() {
    return this.members.me;
  }

  /**
   * The maximum bitrate available for this guild
   * @type {number}
   * @readonly
   */
  get maximumBitrate() {
    if (this.features.includes('VIP_REGIONS')) {
      return 384_000;
    }

    switch (PremiumTiers[this.premiumTier]) {
      case PremiumTiers.TIER_1:
        return 128_000;
      case PremiumTiers.TIER_2:
        return 256_000;
      case PremiumTiers.TIER_3:
        return 384_000;
      default:
        return 96_000;
    }
  }

  /**
   * Fetches a collection of integrations to this guild.
   * Resolves with a collection mapping integrations by their ids.
   * @returns {Promise<Collection<Snowflake|string, Integration>>}
   * @example
   * // Fetch integrations
   * guild.fetchIntegrations()
   *   .then(integrations => console.log(`Fetched ${integrations.size} integrations`))
   *   .catch(console.error);
   */
  async fetchIntegrations() {
    const data = await this.client.api.guilds(this.id).integrations.get();
    return data.reduce(
      (collection, integration) => collection.set(integration.id, new Integration(this.client, integration, this)),
      new Collection(),
    );
  }

  /**
   * An object containing information about a guild's vanity invite.
   * @typedef {Object} Vanity
   * @property {?string} code Vanity invite code
   * @property {number} uses How many times this invite has been used
   */

  /**
   * Fetches the vanity URL invite object to this guild.
   * Resolves with an object containing the vanity URL invite code and the use count
   * @returns {Promise<Vanity>}
   * @example
   * // Fetch invite data
   * guild.fetchVanityData()
   *   .then(res => {
   *     console.log(`Vanity URL: https://discord.gg/${res.code} with ${res.uses} uses`);
   *   })
   *   .catch(console.error);
   */
  async fetchVanityData() {
    const data = await this.client.api.guilds(this.id, 'vanity-url').get();
    this.vanityURLCode = data.code;
    this.vanityURLUses = data.uses;

    return data;
  }

  /**
   * Fetches all webhooks for the guild.
   * @returns {Promise<Collection<Snowflake, Webhook>>}
   * @example
   * // Fetch webhooks
   * guild.fetchWebhooks()
   *   .then(webhooks => console.log(`Fetched ${webhooks.size} webhooks`))
   *   .catch(console.error);
   */
  async fetchWebhooks() {
    const apiHooks = await this.client.api.guilds(this.id).webhooks.get();
    const hooks = new Collection();
    for (const hook of apiHooks) hooks.set(hook.id, new Webhook(this.client, hook));
    return hooks;
  }

  /**
   * Options used to fetch audit logs.
   * @typedef {Object} GuildAuditLogsFetchOptions
   * @property {Snowflake|GuildAuditLogsEntry} [before] Consider only entries before this entry
   * @property {Snowflake|GuildAuditLogsEntry} [after] Consider only entries after this entry
   * @property {number} [limit] The number of entries to return
   * @property {UserResolvable} [user] Only return entries for actions made by this user
   * @property {AuditLogAction|number} [type] Only return entries for this action type
   */

  /**
   * Fetches audit logs for this guild.
   * @param {GuildAuditLogsFetchOptions} [options={}] Options for fetching audit logs
   * @returns {Promise<GuildAuditLogs>}
   * @example
   * // Output audit log entries
   * guild.fetchAuditLogs()
   *   .then(audit => console.log(audit.entries.first()))
   *   .catch(console.error);
   */
  async fetchAuditLogs({ before, after, limit, user, type } = {}) {
    const data = await this.client.api.guilds(this.id)['audit-logs'].get({
      query: {
        before: before?.id ?? before,
        after: after?.id ?? after,
        limit,
        user_id: this.client.users.resolveId(user),
        action_type: typeof type === 'string' ? GuildAuditLogs.Actions[type] : type,
      },
    });

    return GuildAuditLogs.build(this, data);
  }

  /**
   * The data for editing a guild.
   * @typedef {Object} GuildEditData
   * @property {string} [name] The name of the guild
   * @property {?(VerificationLevel|number)} [verificationLevel] The verification level of the guild
   * @property {?(ExplicitContentFilterLevel|number)} [explicitContentFilter] The level of the explicit content filter
   * @property {?VoiceChannelResolvable} [afkChannel] The AFK channel of the guild
   * @property {?TextChannelResolvable} [systemChannel] The system channel of the guild
   * @property {number} [afkTimeout] The AFK timeout of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [icon] The icon of the guild
   * @property {GuildMemberResolvable} [owner] The owner of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [splash] The invite splash image of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [discoverySplash] The discovery splash image of the guild
   * @property {?(BufferResolvable|Base64Resolvable)} [banner] The banner of the guild
   * @property {?(DefaultMessageNotificationLevel|number)} [defaultMessageNotifications] The default message
   * notification level of the guild
   * @property {SystemChannelFlagsResolvable} [systemChannelFlags] The system channel flags of the guild
   * @property {?TextChannelResolvable} [publicUpdatesChannel] The community updates channel of the guild
   * @property {?string} [preferredLocale] The preferred locale of the guild
   * @property {?TextChannelResolvable} [safetyAlertsChannel] The safety alerts channel of the guild
   * @property {boolean} [premiumProgressBarEnabled] Whether the guild's premium progress bar is enabled
   * @property {?string} [description] The discovery description of the guild
   * @property {Features[]} [features] The features of the guild
   */

  /**
   * Data that can be resolved to a Text Channel object. This can be:
   * * A TextChannel
   * * A Snowflake
   * @typedef {TextChannel|Snowflake} TextChannelResolvable
   */

  /**
   * Data that can be resolved to a Voice Channel object. This can be:
   * * A VoiceChannel
   * * A Snowflake
   * @typedef {VoiceChannel|Snowflake} VoiceChannelResolvable
   */

  /**
   * Updates the guild with new information - e.g. a new name.
   * @param {GuildEditData} data The data to update the guild with
   * @param {string} [reason] Reason for editing this guild
   * @returns {Promise<Guild>}
   * @example
   * // Set the guild name
   * guild.edit({
   *   name: 'Discord Guild',
   * })
   *   .then(updated => console.log(`New guild name ${updated}`))
   *   .catch(console.error);
   */
  async edit(data, reason) {
    const _data = {};
    if (data.name) _data.name = data.name;
    if (typeof data.verificationLevel !== 'undefined') {
      _data.verification_level =
        typeof data.verificationLevel === 'number'
          ? data.verificationLevel
          : VerificationLevels[data.verificationLevel];
    }
    if (typeof data.afkChannel !== 'undefined') {
      _data.afk_channel_id = this.client.channels.resolveId(data.afkChannel);
    }
    if (typeof data.systemChannel !== 'undefined') {
      _data.system_channel_id = this.client.channels.resolveId(data.systemChannel);
    }
    if (data.afkTimeout) _data.afk_timeout = Number(data.afkTimeout);
    if (typeof data.icon !== 'undefined') _data.icon = await DataResolver.resolveImage(data.icon);
    if (data.owner) _data.owner_id = this.client.users.resolveId(data.owner);
    if (typeof data.splash !== 'undefined') _data.splash = await DataResolver.resolveImage(data.splash);
    if (typeof data.discoverySplash !== 'undefined') {
      _data.discovery_splash = await DataResolver.resolveImage(data.discoverySplash);
    }
    if (typeof data.banner !== 'undefined') _data.banner = await DataResolver.resolveImage(data.banner);
    if (typeof data.explicitContentFilter !== 'undefined') {
      _data.explicit_content_filter =
        typeof data.explicitContentFilter === 'number'
          ? data.explicitContentFilter
          : ExplicitContentFilterLevels[data.explicitContentFilter];
    }
    if (typeof data.defaultMessageNotifications !== 'undefined') {
      _data.default_message_notifications =
        typeof data.defaultMessageNotifications === 'number'
          ? data.defaultMessageNotifications
          : DefaultMessageNotificationLevels[data.defaultMessageNotifications];
    }
    if (typeof data.systemChannelFlags !== 'undefined') {
      _data.system_channel_flags = SystemChannelFlags.resolve(data.systemChannelFlags);
    }
    if (typeof data.rulesChannel !== 'undefined') {
      _data.rules_channel_id = this.client.channels.resolveId(data.rulesChannel);
    }
    if (typeof data.publicUpdatesChannel !== 'undefined') {
      _data.public_updates_channel_id = this.client.channels.resolveId(data.publicUpdatesChannel);
    }
    if (typeof data.features !== 'undefined') {
      _data.features = data.features;
    }
    if (typeof data.description !== 'undefined') {
      _data.description = data.description;
    }
    if (typeof data.preferredLocale !== 'undefined') _data.preferred_locale = data.preferredLocale;
    if (typeof data.safetyAlertsChannel !== 'undefined') {
      _data.safety_alerts_channel_id = this.client.channels.resolveId(data.safetyAlertsChannel);
    }
    if ('premiumProgressBarEnabled' in data) _data.premium_progress_bar_enabled = data.premiumProgressBarEnabled;
    const newData = await this.client.api.guilds(this.id).patch({ data: _data, reason });
    return this.client.actions.GuildUpdate.handle(newData).updated;
  }

  /**
   * Leaves the guild.
   * @returns {Promise<Guild>}
   * @example
   * // Leave a guild
   * guild.leave()
   *   .then(guild => console.log(`Left the guild: ${guild.name}`))
   *   .catch(console.error);
   */
  async leave() {
    if (this.ownerId === this.client.user.id) throw new Error('GUILD_OWNED');
    await this.client.api.users('@me').guilds(this.id).delete();
    return this.client.actions.GuildDelete.handle({ id: this.id }).guild;
  }

  /**
   * Deletes the guild.
   * @returns {Promise<Guild>}
   * @example
   * // Delete a guild
   * guild.delete()
   *   .then(g => console.log(`Deleted the guild ${g}`))
   *   .catch(console.error);
   */
  async delete() {
    await this.client.api.guilds(this.id).delete();
    return this.client.actions.GuildDelete.handle({ id: this.id }).guild;
  }

  /**
   * Whether this guild equals another guild. It compares all properties, so for most operations
   * it is advisable to just compare `guild.id === guild2.id` as it is much faster and is often
   * what most users need.
   * @param {Guild} guild The guild to compare with
   * @returns {boolean}
   */
  equals(guild) {
    return (
      guild &&
      guild instanceof this.constructor &&
      this.id === guild.id &&
      this.available === guild.available &&
      this.splash === guild.splash &&
      this.discoverySplash === guild.discoverySplash &&
      this.name === guild.name &&
      this.memberCount === guild.memberCount &&
      this.large === guild.large &&
      this.icon === guild.icon &&
      this.ownerId === guild.ownerId &&
      this.verificationLevel === guild.verificationLevel &&
      (this.features === guild.features ||
        (this.features.length === guild.features.length &&
          this.features.every((feat, i) => feat === guild.features[i])))
    );
  }

  toJSON() {
    const json = super.toJSON({
      available: false,
      createdTimestamp: true,
      presences: false,
      voiceStates: false,
    });
    json.iconURL = this.iconURL();
    json.splashURL = this.splashURL();
    json.discoverySplashURL = this.discoverySplashURL();
    json.bannerURL = this.bannerURL();
    return json;
  }

  /**
   * The voice state adapter for this guild that can be used with @discordjs/voice to play audio in voice
   * and stage channels.
   * @type {Function}
   * @readonly
   */
  get voiceAdapterCreator() {
    return methods => {
      this.client.voice.adapters.set(this.id, methods);
      return {
        sendPayload: data => {
          if (this.shard.status !== Status.READY) return false;
          this.shard.send(data);
          return true;
        },
        destroy: () => {
          this.client.voice.adapters.delete(this.id);
        },
      };
    };
  }

  /**
   * Creates a collection of this guild's roles, sorted by their position and ids.
   * @returns {Collection<Snowflake, Role>}
   * @private
   */
  _sortedRoles() {
    return Util.discordSort(this.roles.cache);
  }

  /**
   * Creates a collection of this guild's or a specific category's channels, sorted by their position and ids.
   * @param {GuildChannel} [channel] Category to get the channels of
   * @returns {Collection<Snowflake, GuildChannel>}
   * @private
   */
  _sortedChannels(channel) {
    const category = channel.type === ChannelTypes.GUILD_CATEGORY;
    return Util.discordSort(
      this.channels.cache.filter(
        c =>
          (['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_STORE'].includes(channel.type)
            ? ['GUILD_TEXT', 'GUILD_NEWS', 'GUILD_STORE'].includes(c.type)
            : c.type === channel.type) &&
          (category || c.parent === channel.parent),
      ),
    );
  }
}

exports.Guild = Guild;

/**
 * @external APIGuild
 * @see {@link https://discord.com/developers/docs/resources/guild#guild-object}
 */
