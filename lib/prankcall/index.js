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
 * @param {function} producer
 * @param {object} options
 * - `{number} [timeout=2000]`
 * - `{number} [retries=10]` For `node-retry`
 * - `{number} [factor=2]` For `node-retry`
 * - `{number} [maxTimeout=Infinity]` For `node-retry`
 * - `{number} [randomize=false]` For `node-retry`
 * @see node-retry https://github.com/tim-kos/node-retry#api
 */
exports.start = function *(producer, contIf, options) {
  var gen;
  var prod;
  var maxRetry = 3;
  var curRetry = 0;
  var continueLoop = true;

  while (true) {
    try {
      var prod = yield* producer();
      continueLoop = contIf(/* Ex. JSON with `total_posts` available */);
    } catch (err) {
      if (curRetry === maxRetry) {
        throw err;
      } else {
        curRetry++;
      }
    }

    if (!continueLoop) {
      break;
    }
  }
};
