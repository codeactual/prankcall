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
exports.start = function *(producer, options) {
  var gen = producer();
  var prod;

  while (true) {
    try {
      prod = gen.next();
      if (prod.done) {
        return;
      } else {
        yield prod.value;
      }
    } catch (err) {
      console.error('prod err', err);
    }
  }
};
