/**
 * Call a function periodically with backoff and other customization
 *
 * Licensed under MIT.
 * Copyright (c) 2014 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

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

var co = require('co');
var retry = require('retry');

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * Prankcall constructor.
 *
 * Usage:
 *
 *     var prankcall = Prankcall.create();
 *     prankcall.retry({retries: 3}); // node-retry options
 *
 *     var send = function *() {
 *        // ... async read ...
 *        return data;
 *     };
 *     var recv = function *() {
 *        // ... async read ...
 *        return true; // keep reading
 *     };
 *
 *     prankcall.receiver(recv).start(send);
 *
 * Configuration:
 *
 * - `{object} retry` Valid `node-retry` options
 *   - `{number} [timeout=2000]`
 *   - `{number} [retries=10]`
 *   - `{number} [factor=2]`
 *   - `{number} [maxTimeout=Infinity]`
 *   - `{boolean} [randomize=false]`
 * - `{function *} [receiver=none]` Optional consumer of each call's return value
 *   - `return true` to make another call
 *   - `return <falsey>` stop calling
 * - `{number} [sleep=1000]` Delay (in milliseconds) after successful call
 * @see node-retry https://github.com/tim-kos/node-retry/#api
 */
function Prankcall() {
  this.settings = {
    retry: {},
    receiver: Prankcall.defaultReceiver,
    sleep: 1000
  };
}

configurable(Prankcall.prototype);

Prankcall.prototype.receiver = function(fn) {
  return this.set('receiver', fn);
};

Prankcall.prototype.retry = function(options) {
  return this.set('retry', options);
};

Prankcall.prototype.sleep = function(ms) {
  return this.set('sleep', ms);
};

/**
 * Yield to `sender` and retry after an exception.
 *
 * - By default, collect only one result from `sender`.
 *   - Return `true` from a Prankcall.prototype.receiver generator to collect another.
 * - By default, backoff according to stock `node-retry` settings.
 *
 * @param {function *} sender
 */
Prankcall.prototype.send = function *(sender) {
  var backoffTime;
  var callAgain = true;
  var callReturn;
  var sleep = Prankcall.sleep;
  var timeouts = retry.timeouts(this.get('retry')); // Ex. [ 1000, 2000, 4000, ...]

  while (callAgain) {
    try {
      callReturn = yield sender();
    } catch (err) {
      backoffTime = timeouts.shift();
      if (backoffTime === undefined) {
        throw err;
      } else {
        sleep(backoffTime);
      }
    }

    callAgain = !!(yield this.get('receiver')(callReturn));

    if (callAgain) {
      yield sleep(this.get('sleep'));
    }
  }
};

/**
 * Err on the side of halting the generator after one call instead of
 * unexpectedly running it forever.
 */
Prankcall.defaultReceiver = function*() {
  yield Prankcall.noOpCallback;
  return false;
};

Prankcall.noOpCallback = function(done) {
  done();
};

Prankcall.sleep = function(ms) {
  return function prankCallSleep(done) {
    setTimeout(done, ms);
  };
};
