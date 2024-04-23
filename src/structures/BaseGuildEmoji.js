'use strict';

const { Emoji } = require('./Emoji');

/**
 * Parent class for {@link GuildEmoji} and {@link GuildPreviewEmoji}.
 * @extends {Emoji}
 * @abstract
 */
class BaseGuildEmoji extends Emoji {
  constructor(client, data, guild) {
    super(client, data);

    /**
     * The guild this emoji is a part of
     * @type {Guild|GuildPreview}
     */
    this.guild = guild;

    this.managed = null;
    this.available = null;

    this._patch(data);
  }

  _patch(data) {
    if ('name' in data) this.name = data.name;

    if ('managed' in data) {
      /**
       * Whether this emoji is managed by an external service
       * @type {?boolean}
       */
      this.managed = data.managed;
    }

    if ('available' in data) {
      /**
       * Whether this emoji is available
       * @type {?boolean}
       */
      this.available = data.available;
    }
  }
}

module.exports = BaseGuildEmoji;
