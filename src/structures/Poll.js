'use strict';

const { Collection } = require('@discordjs/collection');
const Base = require('./Base');
const { PollAnswer } = require('./PollAnswer');
const { DiscordjsError } = require('../errors/DJSError');
const { Messages } = require('../errors/index');

/**
 * Represents a Poll
 * @extends {Base}
 */
class Poll extends Base {
  constructor(client, data, message) {
    super(client);

    /**
     * The message that started this poll
     * @name Poll#message
     * @type {Message}
     * @readonly
     */

    Object.defineProperty(this, 'message', { value: message });

    /**
     * The question text of this poll
     * @type {string}
     */
    this.question = data.question.text;

    /**
     * The answers of this poll
     * @type {Collection<number, PollAnswer>}
     */
    this.answers = data.answers.reduce(
      (acc, answer) => acc.set(answer.answer_id, new PollAnswer(this.client, answer, this)),
      new Collection(),
    );

    /**
     * The timestamp when this poll expires
     * @type {number}
     */
    this.expiresTimestamp = Date.parse(data.expiry);

    /**
     * Whether this poll allows multiple answers
     * @type {boolean}
     */
    this.allowMultiselect = data.allow_multiselect;

    /**
     * The layout type of this poll
     * @type {PollLayoutType}
     */
    this.layoutType = data.layout_type;

    this._patch(data);
  }

  _patch(data) {
    if (data.results) {
      /**
       * Whether this poll's results have been precisely counted
       * @type {boolean}
       */
      this.resultsFinalized = data.results.is_finalized;

      for (const answerResult of data.results.answer_counts) {
        const answer = this.answers.get(answerResult.id);
        answer._patch(answerResult);
      }
    } else {
      this.resultsFinalized ??= false;
    }
  }

  /**
   * The date when this poll expires
   * @type {Date}
   * @readonly
   */
  get expiresAt() {
    return new Date(this.expiresTimestamp);
  }

  /**
   * End this poll
   * @returns {Promise<void>}
   */
  async end() {
    if (Date.now() > this.expiresTimestamp) {
      throw new DiscordjsError(Messages.POLL_ALREADY_EXPIRED);
    }
    await this.client.api.channels(this.message.channel.id).polls(this.message.id).expire.post();
  }
}

exports.Poll = Poll;