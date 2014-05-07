/**
 * Call a function periodically with backoff and other customization
 *
 * Licensed under MIT.
 * Copyright (c) 2014 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

var retry = require('retry');

/**
 * Reference to Prankcall.
 */
exports.Prankcall = Prankcall;

/**
 * Create a new Prankcall.
 *
 * @return {object}
 */
exports.create = function() { return new Prankcall(); };

/**
 * Extend Prankcall.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function(ext) { return extend(Prankcall.prototype, ext); };

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * Prankcall constructor.
 *
 * Usage:
 *
 *     var prankcall = Prankcall.create();
 *     prankcall.producer(generator).start()
 *
 * - `{type} ...` ...
 */
function Prankcall() {
  this.settings = {
    continueIf: prankCallDefaultContinueIf
  };
}

configurable(Prankcall.prototype);

Prankcall.prototype.continueIf = function(fn) {
  return this.set('continueIf', fn);
};

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
Prankcall.prototype.start = function *(producer) {
  var gen;
  var prod;
  var maxRetry = 3;
  var curRetry = 0;
  var continueLoop = true;

  while (true) {
    try {
      prod = yield* producer();
      continueLoop = this.get('continueIf')(/* Ex. JSON with `total_posts` available */);
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

/**
 * Err on the side of halting the generator after one execution
 * rather than accidentally running it forever.
 */
function prankCallDefaultContinueIf() {
  return false;
}
