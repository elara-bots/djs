'use strict';

const User = require('./User');
const DataResolver = require('../util/DataResolver');

/**
 * Represents the logged in client's Discord user.
 * @extends {User}
 */
class ClientUser extends User {
  _patch(data) {
    super._patch(data);

    if ('token' in data) this.client.token = data.token;
  }

  /**
   * Represents the client user's presence
   * @type {ClientPresence}
   * @readonly
   */
  get presence() {
    return this.client.presence;
  }

  /**
   * Data used to edit the logged in client
   * @typedef {Object} ClientUserEditData
   * @property {string} [username] The new username
   * @property {?(BufferResolvable|Base64Resolvable)} [avatar] The new avatar
   * @property {?(BufferResolvable|Base64Resolvable)} [banner] The new banner
   */

  /**
   * Edits the logged in client.
   * @param {ClientUserEditData} data The new data
   * @returns {Promise<ClientUser>}
   */
  async edit({ username, avatar, banner }) {
    const data = await this.client.api.users('@me').patch({
      data: {
        username,
        avatar: avatar && (await DataResolver.resolveImage(avatar)),
        banner: banner && (await DataResolver.resolveImage(banner)),
      },
    });

    this.client.token = data.token;
    const { updated } = this.client.actions.UserUpdate.handle(data);
    return updated ?? this;
  }
}

module.exports = ClientUser;
