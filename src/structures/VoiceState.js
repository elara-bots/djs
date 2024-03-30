'use strict';

const Base = require('./Base');

/**
 * Represents the voice state for a Guild Member.
 * @extends {Base}
 */
class VoiceState extends Base {
  constructor(guild, data) {
    super(guild.client);
    /**
     * The guild of this voice state
     * @type {Guild}
     */
    this.guild = guild;
    /**
     * The id of the member of this voice state
     * @type {Snowflake}
     */
    this.id = data.user_id;
    this._patch(data);
  }

  _patch(data) {
    if ('deaf' in data) {
      /**
       * Whether this member is deafened server-wide
       * @type {?boolean}
       */
      this.serverDeaf = data.deaf;
    } else {
      this.serverDeaf ??= null;
    }

    if ('mute' in data) {
      /**
       * Whether this member is muted server-wide
       * @type {?boolean}
       */
      this.serverMute = data.mute;
    } else {
      this.serverMute ??= null;
    }

    if ('self_deaf' in data) {
      /**
       * Whether this member is self-deafened
       * @type {?boolean}
       */
      this.selfDeaf = data.self_deaf;
    } else {
      this.selfDeaf ??= null;
    }

    if ('self_mute' in data) {
      /**
       * Whether this member is self-muted
       * @type {?boolean}
       */
      this.selfMute = data.self_mute;
    } else {
      this.selfMute ??= null;
    }

    if ('self_video' in data) {
      /**
       * Whether this member's camera is enabled
       * @type {?boolean}
       */
      this.selfVideo = data.self_video;
    } else {
      this.selfVideo ??= null;
    }

    if ('session_id' in data) {
      /**
       * The session id for this member's connection
       * @type {?string}
       */
      this.sessionId = data.session_id;
    } else {
      this.sessionId ??= null;
    }

    // The self_stream is property is omitted if false, check for another property
    // here to avoid incorrectly clearing this when partial data is specified
    if ('self_video' in data) {
      /**
       * Whether this member is streaming using "Screen Share"
       * @type {boolean}
       */
      this.streaming = data.self_stream ?? false;
    } else {
      this.streaming ??= null;
    }

    if ('channel_id' in data) {
      /**
       * The {@link VoiceChannel} or {@link StageChannel} id the member is in
       * @type {?Snowflake}
       */
      this.channelId = data.channel_id;
    } else {
      this.channelId ??= null;
    }

    if ('suppress' in data) {
      /**
       * Whether this member is suppressed from speaking. This property is specific to stage channels only.
       * @type {boolean}
       */
      this.suppress = data.suppress;
    }

    if ('request_to_speak_timestamp' in data) {
      /**
       * The time at which the member requested to speak. This property is specific to stage channels only.
       * @type {?number}
       */
      this.requestToSpeakTimestamp = data.request_to_speak_timestamp && Date.parse(data.request_to_speak_timestamp);
    } else {
      this.requestToSpeakTimestamp ??= null;
    }

    return this;
  }

  /**
   * The member that this voice state belongs to
   * @type {?GuildMember}
   * @readonly
   */
  get member() {
    return this.guild.members.cache.get(this.id) ?? null;
  }

  /**
   * The channel that the member is connected to
   * @type {?(VoiceChannel|StageChannel)}
   * @readonly
   */
  get channel() {
    return this.guild.channels.cache.get(this.channelId) ?? null;
  }

  /**
   * Whether this member is either self-deafened or server-deafened
   * @type {?boolean}
   * @readonly
   */
  get deaf() {
    return this.serverDeaf || this.selfDeaf;
  }

  /**
   * Whether this member is either self-muted or server-muted
   * @type {?boolean}
   * @readonly
   */
  get mute() {
    return this.serverMute || this.selfMute;
  }

  toJSON() {
    return super.toJSON({
      id: true,
      serverDeaf: true,
      serverMute: true,
      selfDeaf: true,
      selfMute: true,
      sessionId: true,
      channelId: 'channel',
    });
  }
}

module.exports = VoiceState;
