/**
 * Call a function periodically with backoff and other customization
 *
 * Licensed under MIT.
 * Copyright (c) 2014 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

var retry = require('retry');

var requireComponent = require('../component/require');

/**
 * Download all pages of an offset-pageable resource.
 *
 * - Entity-agnostic: should work with any method that supports `offset`
 * - Rate-limited: by default, 1 request per 10 seconds based on v1 docs
 *
 * @param {function} producer
 * @param {function} consumer
 * @param {object} options
 * - `{number} [timeout=2000]`
 * - `{number} [limit=20]`
 * - `{object} req` Method-specific request params
 * - `{number} [sleep=10000]` Sleep time in milliseconds
 * - `{number} [retries=10]` For `node-retry`
 * - `{number} [factor=2]` For `node-retry`
 * - `{number} [maxTimeout=Infinity]` For `node-retry`
 * - `{number} [randomize=false]` For `node-retry`
 * @see v1 https://www.tumblr.com/docs/en/api/v1
 * @see node-retry https://github.com/tim-kos/node-retry#api
 */
exports.start = function *(producer, options) {
  var results = yield producer();
  return results;
};

exports.sleep = function(ms) {
  return function(wake) {
    setTimeout(wake, ms);
  };
};
