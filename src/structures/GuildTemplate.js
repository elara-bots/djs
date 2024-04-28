'use strict';

const Base = require('./Base');

/**
 * Represents the template for a guild.
 * @extends {Base}
 */
class GuildTemplate extends Base {
  constructor(client, data) {
    super(client);
    this._patch(data);
  }

  _patch(data) {
    if ('code' in data) {
      /**
       * The unique code of this template
       * @type {string}
       */
      this.code = data.code;
    }

    if ('name' in data) {
      /**
       * The name of this template
       * @type {string}
       */
      this.name = data.name;
    }

    if ('description' in data) {
      /**
       * The description of this template
       * @type {?string}
       */
      this.description = data.description;
    }

    if ('usage_count' in data) {
      /**
       * The amount of times this template has been used
       * @type {number}
       */
      this.usageCount = data.usage_count;
    }

    if ('creator_id' in data) {
      /**
       * The id of the user that created this template
       * @type {Snowflake}
       */
      this.creatorId = data.creator_id;
    }

    if ('creator' in data) {
      /**
       * The user that created this template
       * @type {User}
       */
      this.creator = this.client.users._add(data.creator);
    }

    if ('created_at' in data) {
      /**
       * The time when this template was created at
       * @type {Date}
       */
      this.createdAt = new Date(data.created_at);
    }

    if ('updated_at' in data) {
      /**
       * The time when this template was last synced to the guild
       * @type {Date}
       */
      this.updatedAt = new Date(data.updated_at);
    }

    if ('source_guild_id' in data) {
      /**
       * The id of the guild that this template belongs to
       * @type {Snowflake}
       */
      this.guildId = data.source_guild_id;
    }

    if ('serialized_source_guild' in data) {
      /**
       * The data of the guild that this template would create
       * @type {APIGuild}
       */
      this.serializedGuild = data.serialized_source_guild;
    }

    /**
     * Whether this template has unsynced changes
     * @type {?boolean}
     */
    this.unSynced = 'is_dirty' in data ? Boolean(data.is_dirty) : null;

    return this;
  }

  /**
   * Options used to edit a guild template.
   * @typedef {Object} EditGuildTemplateOptions
   * @property {string} [name] The name of this template
   * @property {string} [description] The description of this template
   */

  /**
   * Updates the metadata of this template.
   * @param {EditGuildTemplateOptions} [options] Options for editing the template
   * @returns {Promise<GuildTemplate>}
   */
  async edit({ name, description } = {}) {
    const data = await this.client.api.guilds(this.guildId).templates(this.code).patch({ data: { name, description } });
    return this._patch(data);
  }

  /**
   * Syncs this template to the current state of the guild.
   * @returns {Promise<GuildTemplate>}
   */
  async sync() {
    const data = await this.client.api.guilds(this.guildId).templates(this.code).put();
    return this._patch(data);
  }

  /**
   * The timestamp of when this template was created at
   * @type {number}
   * @readonly
   */
  get createdTimestamp() {
    return this.createdAt.getTime();
  }

  /**
   * The timestamp of when this template was last synced to the guild
   * @type {number}
   * @readonly
   */
  get updatedTimestamp() {
    return this.updatedAt.getTime();
  }

  /**
   * The guild that this template belongs to
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId);
  }

  /**
   * The URL of this template
   * @type {string}
   * @readonly
   */
  get url() {
    return `${this.client.options.http.template}/${this.code}`;
  }

  /**
   * When concatenated with a string, this automatically returns the template's code instead of the template object.
   * @returns {string}
   * @example
   * // Logs: Template: FKvmczH2HyUf
   * console.log(`Template: ${guildTemplate}!`);
   */
  toString() {
    return this.code;
  }
}

/**
 * Regular expression that globally matches guild template links
 * @type {RegExp}
 */
GuildTemplate.GUILD_TEMPLATES_PATTERN = /discord(?:app)?\.(?:com\/template|new)\/([\w-]{2,255})/gi;

module.exports = GuildTemplate;
