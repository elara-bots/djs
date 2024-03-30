'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');
const { Sticker } = require('./Sticker');
const SnowflakeUtil = require('../util/SnowflakeUtil');

/**
 * Represents a pack of standard stickers.
 * @extends {Base}
 */
class StickerPack extends Base {
  constructor(client, pack) {
    super(client);
    /**
     * The Sticker pack's id
     * @type {Snowflake}
     */
    this.id = pack.id;

    /**
     * The stickers in the pack
     * @type {Collection<Snowflake, Sticker>}
     */
    this.stickers = new Collection(pack.stickers.map(s => [s.id, new Sticker(client, s)]));

    /**
     * The name of the sticker pack
     * @type {string}
     */
    this.name = pack.name;

    /**
     * The description of the sticker pack
     * @type {string}
     */
    this.description = pack.description;

    /**
     * The id of the sticker pack's banner image
     * @type {?Snowflake}
     */
    this.bannerId = pack.banner_asset_id ?? null;
  }

  /**
   * The timestamp the sticker was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return SnowflakeUtil.timestampFrom(this.id);
  }

  /**
   * The time the sticker was created at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.createdTimestamp);
  }

  /**
   * The URL to this sticker pack's banner.
   * @param {StaticImageURLOptions} [options={}] Options for the Image URL
   * @returns {?string}
   */
  bannerURL({ format, size } = {}) {
    return this.bannerId && this.client.rest.cdn.StickerPackBanner(this.bannerId, format, size);
  }
}

module.exports = StickerPack;
