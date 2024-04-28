'use strict';

const Base = require('./Base');
const { Error } = require('../errors');
const {
  GuildScheduledEventEntityTypes,
  GuildScheduledEventStatuses,
  GuildScheduledEventPrivacyLevels,
  Endpoints,
} = require('../util/Constants');
const SnowflakeUtil = require('../util/SnowflakeUtil');

/**
 * Represents a scheduled event in a {@link Guild}.
 * @extends {Base}
 */
class GuildScheduledEvent extends Base {
  constructor(client, data) {
    super(client);

    /**
     * The id of the guild scheduled event
     * @type {Snowflake}
     */
    this.id = data.id;

    /**
     * The id of the guild this guild scheduled event belongs to
     * @type {Snowflake}
     */
    this.guildId = data.guild_id;

    this._patch(data);
  }

  _patch(data) {
    if ('channel_id' in data) {
      /**
       * The channel id in which the scheduled event will be hosted, or `null` if entity type is `EXTERNAL`
       * @type {?Snowflake}
       */
      this.channelId = data.channel_id;
    } else {
      this.channelId ??= null;
    }

    if ('creator_id' in data) {
      /**
       * The id of the user that created this guild scheduled event
       * @type {?Snowflake}
       */
      this.creatorId = data.creator_id;
    } else {
      this.creatorId ??= null;
    }

    /**
     * The name of the guild scheduled event
     * @type {string}
     */
    this.name = data.name;

    if ('description' in data) {
      /**
       * The description of the guild scheduled event
       * @type {?string}
       */
      this.description = data.description;
    } else {
      this.description ??= null;
    }

    /**
     * The timestamp the guild scheduled event will start at
     * <info>This can be potentially `null` only when it's an {@link AuditLogEntryTarget}</info>
     * @type {?number}
     */
    this.scheduledStartTimestamp = data.scheduled_start_time ? Date.parse(data.scheduled_start_time) : null;

    /**
     * The timestamp the guild scheduled event will end at,
     * or `null` if the event does not have a scheduled time to end
     * @type {?number}
     */
    this.scheduledEndTimestamp = data.scheduled_end_time ? Date.parse(data.scheduled_end_time) : null;

    /**
     * The privacy level of the guild scheduled event
     * @type {PrivacyLevel}
     */
    this.privacyLevel = GuildScheduledEventPrivacyLevels[data.privacy_level];

    /**
     * The status of the guild scheduled event
     * @type {GuildScheduledEventStatus}
     */
    this.status = GuildScheduledEventStatuses[data.status];

    /**
     * The type of hosting entity associated with the scheduled event
     * @type {GuildScheduledEventEntityType}
     */
    this.entityType = GuildScheduledEventEntityTypes[data.entity_type];

    if ('entity_id' in data) {
      /**
       * The id of the hosting entity associated with the scheduled event
       * @type {?Snowflake}
       */
      this.entityId = data.entity_id;
    } else {
      this.entityId ??= null;
    }

    if ('user_count' in data) {
      /**
       * The number of users who are subscribed to this guild scheduled event
       * @type {?number}
       */
      this.userCount = data.user_count;
    } else {
      this.userCount ??= null;
    }

    if ('creator' in data) {
      /**
       * The user that created this guild scheduled event
       * @type {?User}
       */
      this.creator = this.client.users._add(data.creator);
    } else {
      this.creator ??= this.client.users.resolve(this.creatorId);
    }

    /* eslint-disable max-len */
    /**
     * Represents the additional metadata for a {@link GuildScheduledEvent}
     * @see {@link https://discord.com/developers/docs/resources/guild-scheduled-event#guild-scheduled-event-object-guild-scheduled-event-entity-metadata}
     * @typedef {Object} GuildScheduledEventEntityMetadata
     * @property {?string} location The location of the guild scheduled event
     */
    /* eslint-enable max-len */

    if ('entity_metadata' in data) {
      if (data.entity_metadata) {
        /**
         * Additional metadata
         * @type {?GuildScheduledEventEntityMetadata}
         */
        this.entityMetadata = {
          location: data.entity_metadata.location ?? this.entityMetadata?.location ?? null,
        };
      } else {
        this.entityMetadata = null;
      }
    } else {
      this.entityMetadata ??= null;
    }

    if ('image' in data) {
      /**
       * The cover image hash for this scheduled event
       * @type {?string}
       */
      this.image = data.image;
    } else {
      this.image ??= null;
    }
  }

  /**
   * The URL of this scheduled event's cover image
   * @param {StaticImageURLOptions} [options={}] Options for image URL
   * @returns {?string}
   */
  coverImageURL({ format, size } = {}) {
    return this.image && this.client.rest.cdn.guildScheduledEventCover(this.id, this.image, format, size);
  }

  /**
   * The timestamp the guild scheduled event was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the guild scheduled event was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * The time the guild scheduled event will start at
   * @type {Date}
   * @readonly
   */
  get scheduledStartAt() {
    return new Date(this.scheduledStartTimestamp);
  }

  /**
   * The time the guild scheduled event will end at,
   * or `null` if the event does not have a scheduled time to end
   * @type {?Date}
   * @readonly
   */
  get scheduledEndAt() {
    return this.scheduledEndTimestamp && new Date(this.scheduledEndTimestamp);
  }

  /**
   * The channel associated with this scheduled event
   * @type {?(VoiceChannel|StageChannel)}
   * @readonly
   */
  get channel() {
    return this.client.channels.resolve(this.channelId);
  }

  /**
   * The guild this scheduled event belongs to
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId);
  }

  /**
   * The URL to the guild scheduled event
   * @type {string}
   * @readonly
   */
  get url() {
    return Endpoints.scheduledEvent(this.client.options.http.scheduledEvent, this.guildId, this.id);
  }

  /**
   * Options used to create an invite URL to a {@link GuildScheduledEvent}
   * @typedef {CreateInviteOptions} CreateGuildScheduledEventInviteURLOptions
   * @property {GuildInvitableChannelResolvable} [channel] The channel to create the invite in.
   * <warn>This is required when the `entityType` of `GuildScheduledEvent` is `EXTERNAL`, gets ignored otherwise</warn>
   */

  /**
   * Creates an invite URL to this guild scheduled event.
   * @param {CreateGuildScheduledEventInviteURLOptions} [options] The options to create the invite
   * @returns {Promise<string>}
   */
  async createInviteURL(options) {
    let channelId = this.channelId;
    if (this.entityType === 'EXTERNAL') {
      if (!options?.channel) throw new Error('INVITE_OPTIONS_MISSING_CHANNEL');
      channelId = this.guild.channels.resolveId(options.channel);
      if (!channelId) throw new Error('GUILD_CHANNEL_RESOLVE');
    }
    const invite = await this.guild.invites.create(channelId, options);
    return Endpoints.invite(this.client.options.http.invite, invite.code, this.id);
  }

  /**
   * Edits this guild scheduled event.
   * @param {GuildScheduledEventEditOptions} options The options to edit the guild scheduled event
   * @returns {Promise<GuildScheduledEvent>}
   * @example
   * // Edit a guild scheduled event
   * guildScheduledEvent.edit({ name: 'Party' })
   *  .then(guildScheduledEvent => console.log(guildScheduledEvent))
   *  .catch(console.error);
   */
  edit(options) {
    return this.guild.scheduledEvents.edit(this.id, options);
  }

  /**
   * When concatenated with a string, this automatically concatenates the event's URL instead of the object.
   * @returns {string}
   * @example
   * // Logs: Event: https://discord.com/events/412345678901234567/499876543211234567
   * console.log(`Event: ${guildScheduledEvent}`);
   */
  toString() {
    return this.url;
  }

  /**
   * Indicates whether this guild scheduled event has an `ACTIVE` status.
   * @returns {boolean}
   */
  isActive() {
    return GuildScheduledEventStatuses[this.status] === GuildScheduledEventStatuses.ACTIVE;
  }

  /**
   * Indicates whether this guild scheduled event has a `CANCELED` status.
   * @returns {boolean}
   */
  isCanceled() {
    return GuildScheduledEventStatuses[this.status] === GuildScheduledEventStatuses.CANCELED;
  }

  /**
   * Indicates whether this guild scheduled event has a `COMPLETED` status.
   * @returns {boolean}
   */
  isCompleted() {
    return GuildScheduledEventStatuses[this.status] === GuildScheduledEventStatuses.COMPLETED;
  }

  /**
   * Indicates whether this guild scheduled event has a `SCHEDULED` status.
   * @returns {boolean}
   */
  isScheduled() {
    return GuildScheduledEventStatuses[this.status] === GuildScheduledEventStatuses.SCHEDULED;
  }
}

exports.GuildScheduledEvent = GuildScheduledEvent;
