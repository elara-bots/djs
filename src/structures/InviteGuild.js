'use strict';

const AnonymousGuild = require('./AnonymousGuild');
/**
 * Represents a guild received from an invite, includes welcome screen data if available.
 * @extends {AnonymousGuild}
 */
class InviteGuild extends AnonymousGuild {}

module.exports = InviteGuild;
