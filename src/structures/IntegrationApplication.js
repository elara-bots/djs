'use strict';

const Application = require('./interfaces/Application');

/**
 * Represents an Integration's OAuth2 Application.
 * @extends {Application}
 */
class IntegrationApplication extends Application {
  _patch(data) {
    super._patch(data);

    if ('bot' in data) {
      this.botId = data.bot?.id;
      if (!this.client.users.cache.has(this.botId)) {
        this.client.users._add(data.bot);
      }
    } else {
      this.botId ??= null;
    }

    if ('terms_of_service_url' in data) {
      /**
       * The URL of the application's terms of service
       * @type {?string}
       */
      this.termsOfServiceURL = data.terms_of_service_url;
    } else {
      this.termsOfServiceURL ??= null;
    }

    if ('privacy_policy_url' in data) {
      /**
       * The URL of the application's privacy policy
       * @type {?string}
       */
      this.privacyPolicyURL = data.privacy_policy_url;
    } else {
      this.privacyPolicyURL ??= null;
    }

    if ('cover_image' in data) {
      /**
       * The hash of the application's cover image
       * @type {?string}
       */
      this.cover = data.cover_image;
    } else {
      this.cover ??= null;
    }
  }

  get bot() {
    return this.client.users.resolve(this.botId);
  }
}

module.exports = IntegrationApplication;
