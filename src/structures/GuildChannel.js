'use strict';

const { Channel } = require('./Channel');
const PermissionOverwriteManager = require('../managers/PermissionOverwriteManager');
const { VoiceBasedChannelTypes } = require('../util/Constants');
const Permissions = require('../util/Permissions');
const { getSortableGroupTypes } = require('../util/Util');

/**
 * Represents a guild channel from any of the following:
 * - {@link TextChannel}
 * - {@link VoiceChannel}
 * - {@link CategoryChannel}
 * - {@link NewsChannel}
 * - {@link StageChannel}
 * - {@link ForumChannel}
 * @extends {Channel}
 * @abstract
 */
class GuildChannel extends Channel {
  constructor(guild, data, client, immediatePatch = true) {
    super(guild?.client ?? client, data, false);

    /**
     * The id of the guild the channel is in
     * @type {Snowflake}
     */
    this.guildId = guild?.id ?? data.guild_id;

    this.parentId = this.parentId ?? null;
    /**
     * A manager of permission overwrites that belong to this channel
     * @type {PermissionOverwriteManager}
     */
    this.permissionOverwrites = new PermissionOverwriteManager(this);

    if (data && immediatePatch) this._patch(data);
  }
  /**
   * The guild the channel is in
   * @type {Guild}
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId) ?? null;
  }

  _patch(data) {
    super._patch(data);

    if ('name' in data) {
      /**
       * The name of the guild channel
       * @type {string}
       */
      this.name = data.name;
    }

    if ('position' in data) {
      /**
       * The raw position of the channel from Discord
       * @type {number}
       */
      this.rawPosition = data.position;
    }

    if ('guild_id' in data) {
      this.guildId = data.guild_id;
    }

    if ('parent_id' in data) {
      /**
       * The id of the category parent of this channel
       * @type {?Snowflake}
       */
      this.parentId = data.parent_id;
    }

    if ('permission_overwrites' in data) {
      this.permissionOverwrites.cache.clear();
      for (const overwrite of data.permission_overwrites) {
        this.permissionOverwrites._add(overwrite);
      }
    }
  }

  _clone() {
    const clone = super._clone();
    clone.permissionOverwrites = new PermissionOverwriteManager(clone, this.permissionOverwrites.cache.values());
    return clone;
  }

  /**
   * The category parent of this channel
   * @type {?CategoryChannel}
   * @readonly
   */
  get parent() {
    return this.guild.channels.resolve(this.parentId);
  }

  /**
   * If the permissionOverwrites match the parent channel, null if no parent
   * @type {?boolean}
   * @readonly
   */
  get permissionsLocked() {
    if (!this.parent) return null;

    // Get all overwrites
    const overwriteIds = new Set([
      ...this.permissionOverwrites.cache.keys(),
      ...this.parent.permissionOverwrites.cache.keys(),
    ]);

    // Compare all overwrites
    return [...overwriteIds].every(key => {
      const channelVal = this.permissionOverwrites.resolve(key);
      const parentVal = this.parent.permissionOverwrites.resolve(key);

      // Handle empty overwrite
      if (
        (!channelVal &&
          parentVal.deny.bitfield === Permissions.defaultBit &&
          parentVal.allow.bitfield === Permissions.defaultBit) ||
        (!parentVal &&
          channelVal.deny.bitfield === Permissions.defaultBit &&
          channelVal.allow.bitfield === Permissions.defaultBit)
      ) {
        return true;
      }

      // Compare overwrites
      return (
        typeof channelVal !== 'undefined' &&
        typeof parentVal !== 'undefined' &&
        channelVal.deny.bitfield === parentVal.deny.bitfield &&
        channelVal.allow.bitfield === parentVal.allow.bitfield
      );
    });
  }

  /**
   * The position of the channel
   * @type {number}
   * @readonly
   */
  get position() {
    const selfIsCategory = this.type === 'GUILD_CATEGORY';
    const types = getSortableGroupTypes(this.type);

    let count = 0;
    for (const channel of this.guild.channels.cache.values()) {
      if (!types.includes(channel.type)) continue;
      if (!selfIsCategory && channel.parentId !== this.parentId) continue;
      if (this.rawPosition === channel.rawPosition) {
        if (BigInt(channel.id) < BigInt(this.id)) count++;
      } else if (this.rawPosition > channel.rawPosition) {
        count++;
      }
    }

    return count;
  }

  /**
   * Gets the overall set of permissions for a member or role in this channel, taking into account channel overwrites.
   * @param {GuildMemberResolvable|RoleResolvable} memberOrRole The member or role to obtain the overall permissions for
   * @param {boolean} [checkAdmin=true] Whether having `ADMINISTRATOR` will return all permissions
   * @returns {?Readonly<Permissions>}
   */
  permissionsFor(memberOrRole, checkAdmin = true) {
    const member = this.guild.members.resolve(memberOrRole);
    if (member) return this.memberPermissions(member, checkAdmin);
    const role = this.guild.roles.resolve(memberOrRole);
    return role && this.rolePermissions(role, checkAdmin);
  }

  overwritesFor(member, verified = false, roles = null) {
    if (!verified) member = this.guild.members.resolve(member);
    if (!member) return [];

    roles ??= member.roles.cache;
    const roleOverwrites = [];
    let memberOverwrites;
    let everyoneOverwrites;

    for (const overwrite of this.permissionOverwrites.cache.values()) {
      if (overwrite.id === this.guild.id) {
        everyoneOverwrites = overwrite;
      } else if (roles.has(overwrite.id)) {
        roleOverwrites.push(overwrite);
      } else if (overwrite.id === member.id) {
        memberOverwrites = overwrite;
      }
    }

    return {
      everyone: everyoneOverwrites,
      roles: roleOverwrites,
      member: memberOverwrites,
    };
  }

  /**
   * Gets the overall set of permissions for a member in this channel, taking into account channel overwrites.
   * @param {GuildMember} member The member to obtain the overall permissions for
   * @param {boolean} checkAdmin=true Whether having `ADMINISTRATOR` will return all permissions
   * @returns {Readonly<Permissions>}
   * @private
   */
  memberPermissions(member, checkAdmin) {
    if (checkAdmin && member.id === this.guild.ownerId) return new Permissions(Permissions.ALL).freeze();

    const roles = member.roles.cache;
    const permissions = new Permissions(roles.map(role => role.permissions));

    if (checkAdmin && permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return new Permissions(Permissions.ALL).freeze();
    }

    const overwrites = this.overwritesFor(member, true, roles);

    return permissions
      .remove(overwrites.everyone?.deny ?? Permissions.defaultBit)
      .add(overwrites.everyone?.allow ?? Permissions.defaultBit)
      .remove(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.deny) : Permissions.defaultBit)
      .add(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.allow) : Permissions.defaultBit)
      .remove(overwrites.member?.deny ?? Permissions.defaultBit)
      .add(overwrites.member?.allow ?? Permissions.defaultBit)
      .freeze();
  }

  /**
   * Gets the overall set of permissions for a role in this channel, taking into account channel overwrites.
   * @param {Role} role The role to obtain the overall permissions for
   * @param {boolean} checkAdmin Whether having `ADMINISTRATOR` will return all permissions
   * @returns {Readonly<Permissions>}
   * @private
   */
  rolePermissions(role, checkAdmin) {
    if (checkAdmin && role.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
      return new Permissions(Permissions.ALL).freeze();
    }

    const everyoneOverwrites = this.permissionOverwrites.resolve(this.guild.id);
    const roleOverwrites = this.permissionOverwrites.resolve(role.id);

    return role.permissions
      .remove(everyoneOverwrites?.deny ?? Permissions.defaultBit)
      .add(everyoneOverwrites?.allow ?? Permissions.defaultBit)
      .remove(roleOverwrites?.deny ?? Permissions.defaultBit)
      .add(roleOverwrites?.allow ?? Permissions.defaultBit)
      .freeze();
  }

  /**
   * A collection of cached members of this channel, mapped by their ids.
   * Members that can view this channel, if the channel is text-based.
   * Members in the channel, if the channel is voice-based.
   * @type {Collection<Snowflake, GuildMember>}
   * @readonly
   */
  get members() {
    return this.guild.members.cache.filter(m => this.permissionsFor(m).has(Permissions.FLAGS.VIEW_CHANNEL, false));
  }

  /**
   * Edits the channel.
   * @param {ChannelData} data The new data for the channel
   * @param {string} [reason] Reason for editing this channel
   * @returns {Promise<GuildChannel>}
   * @example
   * // Edit a channel
   * channel.edit({ name: 'new-channel' })
   *   .then(console.log)
   *   .catch(console.error);
   */
  edit(data, reason) {
    return this.guild.channels.edit(this, data, reason);
  }

  /**
   * Checks if this channel has the same type, topic, position, name, overwrites, and id as another channel.
   * In most cases, a simple `channel.id === channel2.id` will do, and is much faster too.
   * @param {GuildChannel} channel Channel to compare with
   * @returns {boolean}
   */
  equals(channel) {
    let equal =
      channel &&
      this.id === channel.id &&
      this.type === channel.type &&
      this.topic === channel.topic &&
      this.position === channel.position &&
      this.name === channel.name;

    if (equal) {
      if (this.permissionOverwrites && channel.permissionOverwrites) {
        equal = this.permissionOverwrites.cache.equals(channel.permissionOverwrites.cache);
      } else {
        equal = !this.permissionOverwrites && !channel.permissionOverwrites;
      }
    }

    return equal;
  }

  /**
   * Whether the channel is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    return this.manageable && this.guild.rulesChannelId !== this.id && this.guild.publicUpdatesChannelId !== this.id;
  }

  /**
   * Whether the channel is manageable by the client user
   * @type {boolean}
   * @readonly
   */
  get manageable() {
    if (this.client.user.id === this.guild.ownerId) return true;
    const permissions = this.permissionsFor(this.client.user);
    if (!permissions) return false;

    // This flag allows managing even if timed out
    if (permissions.has(Permissions.FLAGS.ADMINISTRATOR, false)) return true;
    if (this.guild.members.me.communicationDisabledUntilTimestamp > Date.now()) return false;

    const bitfield = VoiceBasedChannelTypes.includes(this.type)
      ? Permissions.FLAGS.MANAGE_CHANNELS | Permissions.FLAGS.CONNECT
      : Permissions.FLAGS.VIEW_CHANNEL | Permissions.FLAGS.MANAGE_CHANNELS;
    return permissions.has(bitfield, false);
  }

  /**
   * Whether the channel is viewable by the client user
   * @type {boolean}
   * @readonly
   */
  get viewable() {
    if (this.client.user.id === this.guild.ownerId) return true;
    const permissions = this.permissionsFor(this.client.user);
    if (!permissions) return false;
    return permissions.has(Permissions.FLAGS.VIEW_CHANNEL, false);
  }
}

module.exports = GuildChannel;
