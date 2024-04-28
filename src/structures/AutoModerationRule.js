'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');
const {
  AutoModerationRuleKeywordPresetTypes,
  AutoModerationRuleTriggerTypes,
  AutoModerationRuleEventTypes,
  AutoModerationActionTypes,
} = require('../util/Constants');

/**
 * Represents an auto moderation rule.
 * @extends {Base}
 */
class AutoModerationRule extends Base {
  constructor(client, data, guild) {
    super(client);

    /**
     * The id of this auto moderation rule.
     * @type {Snowflake}
     */
    this.id = data.id;

    this.guildId = guild?.id ?? null;

    /**
     * The user that created this auto moderation rule.
     * @type {Snowflake}
     */
    this.creatorId = data.creator_id;

    /**
     * The trigger type of this auto moderation rule.
     * @type {AutoModerationRuleTriggerType}
     */
    this.triggerType = AutoModerationRuleTriggerTypes[data.trigger_type];

    this._patch(data);
  }

  /**
   * The guild this auto moderation rule is for.
   * @type {Guild}
   */
  get guild() {
    return this.client.guilds.resolve(this.guildId);
  }

  _patch(data) {
    if ('name' in data) {
      /**
       * The name of this auto moderation rule.
       * @type {string}
       */
      this.name = data.name;
    }

    if ('event_type' in data) {
      /**
       * The event type of this auto moderation rule.
       * @type {AutoModerationRuleEventType}
       */
      this.eventType = AutoModerationRuleEventTypes[data.event_type];
    }

    if ('trigger_metadata' in data) {
      /**
       * Additional data used to determine whether an auto moderation rule should be triggered.
       * @typedef {Object} AutoModerationTriggerMetadata
       * @property {string[]} keywordFilter The substrings that will be searched for in the content
       * @property {string[]} regexPatterns The regular expression patterns which will be matched against the content
       * <info>Only Rust-flavored regular expressions are supported.</info>
       * @property {AutoModerationRuleKeywordPresetType[]} presets
       * The internally pre-defined wordsets which will be searched for in the content
       * @property {string[]} allowList The substrings that will be exempt from triggering
       * {@link AutoModerationRuleTriggerType.KEYWORD} and {@link AutoModerationRuleTriggerType.KEYWORD_PRESET}
       * @property {?number} mentionTotalLimit The total number of role & user mentions allowed per message
       * @property {boolean} mentionRaidProtectionEnabled Whether mention raid protection is enabled
       */

      /**
       * The trigger metadata of the rule.
       * @type {AutoModerationTriggerMetadata}
       */
      this.triggerMetadata = {
        keywordFilter: data.trigger_metadata.keyword_filter ?? [],
        regexPatterns: data.trigger_metadata.regex_patterns ?? [],
        presets: data.trigger_metadata.presets?.map(preset => AutoModerationRuleKeywordPresetTypes[preset]) ?? [],
        allowList: data.trigger_metadata.allow_list ?? [],
        mentionTotalLimit: data.trigger_metadata.mention_total_limit ?? null,
        mentionRaidProtectionEnabled: data.trigger_metadata.mention_raid_protection_enabled ?? false,
      };
    }

    if ('actions' in data) {
      /**
       * An object containing information about an auto moderation rule action.
       * @typedef {Object} AutoModerationAction
       * @property {AutoModerationActionType} type The type of this auto moderation rule action
       * @property {AutoModerationActionMetadata} metadata Additional metadata needed during execution
       */

      /**
       * Additional data used when an auto moderation rule is executed.
       * @typedef {Object} AutoModerationActionMetadata
       * @property {?Snowflake} channelId The id of the channel to which content will be logged
       * @property {?number} durationSeconds The timeout duration in seconds
       * @property {?string} customMessage The custom message that is shown whenever a message is blocked
       */

      /**
       * The actions of this auto moderation rule.
       * @type {AutoModerationAction[]}
       */
      this.actions = data.actions.map(action => ({
        type: AutoModerationActionTypes[action.type],
        metadata: {
          durationSeconds: action.metadata.duration_seconds ?? null,
          channelId: action.metadata.channel_id ?? null,
          customMessage: action.metadata.custom_message ?? null,
        },
      }));
    }

    if ('enabled' in data) {
      /**
       * Whether this auto moderation rule is enabled.
       * @type {boolean}
       */
      this.enabled = data.enabled;
    }

    if ('exempt_roles' in data) {
      /**
       * The roles exempt by this auto moderation rule.
       * @type {Collection<Snowflake, Role>}
       */
      this.exemptRoles = new Collection(
        data.exempt_roles.map(exemptRole => [exemptRole, this.guild.roles.resolve(exemptRole)]),
      );
    }

    if ('exempt_channels' in data) {
      /**
       * The channels exempt by this auto moderation rule.
       * @type {Collection<Snowflake, GuildChannel|ThreadChannel>}
       */
      this.exemptChannels = new Collection(
        data.exempt_channels.map(exemptChannel => [exemptChannel, this.guild.channels.resolve(exemptChannel)]),
      );
    }
  }

  /**
   * Edits this auto moderation rule.
   * @param {AutoModerationRuleEditOptions} options Options for editing this auto moderation rule
   * @returns {Promise<AutoModerationRule>}
   */
  edit(options) {
    return this.guild.autoModerationRules.edit(this.id, options);
  }
}

module.exports = AutoModerationRule;
