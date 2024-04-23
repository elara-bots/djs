'use strict';

const AttachmentFlags = require('../util/AttachmentFlags');
const { basename, flatten } = require('../util/Util');

/**
 * Represents an attachment in a message.
 */
class MessageAttachment {
  /**
   * @param {BufferResolvable|Stream} attachment The file
   * @param {string} [name=null] The name of the file, if any
   * @param {APIAttachment} [data] Extra data
   */
  constructor(attachment, name = null, data) {
    this.attachment = attachment;
    /**
     * The name of this attachment
     * @type {?string}
     */
    this.name = name;
    if (data) this._patch(data);
  }

  _patch(data) {
    /**
     * The attachment's id
     * @type {Snowflake}
     */
    this.id = data.id;

    if ('size' in data) {
      /**
       * The size of this attachment in bytes
       * @type {number}
       */
      this.size = data.size;
    }

    if ('url' in data) {
      /**
       * The URL to this attachment
       * @type {string}
       */
      this.url = data.url;
    }

    if ('proxy_url' in data) {
      /**
       * The Proxy URL to this attachment
       * @type {string}
       */
      this.proxyURL = data.proxy_url;
    }

    if ('height' in data) {
      /**
       * The height of this attachment (if an image or video)
       * @type {?number}
       */
      this.height = data.height;
    } else {
      this.height ??= null;
    }

    if ('width' in data) {
      /**
       * The width of this attachment (if an image or video)
       * @type {?number}
       */
      this.width = data.width;
    } else {
      this.width ??= null;
    }

    if ('content_type' in data) {
      /**
       * The media type of this attachment
       * @type {?string}
       */
      this.contentType = data.content_type;
    } else {
      this.contentType ??= null;
    }

    if ('description' in data) {
      /**
       * The description (alt text) of this attachment
       * @type {?string}
       */
      this.description = data.description;
    } else {
      this.description ??= null;
    }

    /**
     * Whether this attachment is ephemeral
     * @type {boolean}
     */
    this.ephemeral = data.ephemeral ?? false;

    if ('duration_secs' in data) {
      /**
       * The duration of this attachment in seconds
       * <info>This will only be available if the attachment is an audio file.</info>
       * @type {?number}
       */
      this.duration = data.duration_secs;
    } else {
      this.duration ??= null;
    }

    if ('waveform' in data) {
      /**
       * The base64 encoded byte array representing a sampled waveform
       * <info>This will only be available if the attachment is an audio file.</info>
       * @type {?string}
       */
      this.waveform = data.waveform;
    } else {
      this.waveform ??= null;
    }

    if ('flags' in data) {
      /**
       * The flags of this attachment
       * @type {Readonly<AttachmentFlags>}
       */
      this.flags = new AttachmentFlags(data.flags).freeze();
    } else {
      this.flags ??= new AttachmentFlags().freeze();
    }
  }

  /**
   * Whether or not this attachment has been marked as a spoiler
   * @type {boolean}
   * @readonly
   */
  get spoiler() {
    return basename(this.url ?? this.name).startsWith('SPOILER_');
  }

  toJSON() {
    return flatten(this);
  }
}

module.exports = MessageAttachment;

/**
 * @external APIAttachment
 * @see {@link https://discord.com/developers/docs/resources/channel#attachment-object}
 */
