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

var events = require('events');
var retry = require('retry');
var util = require('util');

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * Prankcall constructor.
 *
 * Usage:
 *
 *     var prankcall = require('prankcall').create();
 *     prankcall.retry({retries: 3}); // `retry` options
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
 *     yield prankcall.recv(recv).send(send);
 *
 * Configuration:
 *
 * - `{object} retry` Valid `retry` options
 *   - To disable: `prankcall.disable('retry')`
 *   - Default values below are from `retry`
 *   - `{number} [timeout=2000]`
 *   - `{number} [retries=10]`
 *   - `{number} [factor=2]`
 *   - `{number} [maxTimeout=Infinity]`
 *   - `{boolean} [randomize=false]`
 * - `{function *} [receive=none]` Optional consumer of each call's return value
 *   - `return true` to make another call
 *   - `return <falsey>` stop calling
 * - `{number} [sleep=1000]` Delay (in milliseconds) after successful call
 * @see tim-kos/node-retry https://github.com/tim-kos/node-retry/#api
 */
function Prankcall() {
  this.settings = {
    retry: {},
    recv: Prankcall.defaultReceive,
    sleep: 1000
  };
  events.EventEmitter.call(this);
}

util.inherits(Prankcall, events.EventEmitter);
configurable(Prankcall.prototype);

Prankcall.prototype.recv = function(recv) {
  return this.set('recv', recv);
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
 *   - Return `true` from a Prankcall.prototype.receive generator to collect another.
 * - By default, backoff according to stock `retry` settings.
 *
 * @param {function *} sender
 */
Prankcall.prototype.send = function *(sender) {
  var backoffTime;
  var callAgain = true;
  var callAgainSleep = this.get('sleep');
  var callReturn;
  var callSuccess;
  var sleep = Prankcall.sleep;
  var stats = {
    calls: 0
  };
  var timeouts = this.calcTimeouts();

  while (callAgain) { // 1st run, retry, or intended
    try {
      this.emit('call', {calls: stats.calls});
      callReturn = yield sender();
      callSuccess = true;
      stats.calls++;
    } catch (err) {
      backoffTime = timeouts.shift();
      if (backoffTime === undefined) { // Retries exhausted
        throw err;
      } else {
        callSuccess = false;
        sleep(backoffTime);
      }
    }

    if (callSuccess) {
      callAgain = !!(yield this.get('recv')(callReturn));
      if (callAgain) {
        timeouts = this.calcTimeouts(); // Reset timeouts
        if (callAgainSleep) {
          yield sleep(callAgainSleep);
        }
      }
    }
  }
};

/**
 * Use `retry` to calculate timeout durations.
 *
 * @return {array} Ex. `[1000, 2000, 4000, ...]`
 */
Prankcall.prototype.calcTimeouts = function() {
  var retryOpts = this.get('retry');
  return typeof retryOpts === 'object' ? retry.timeouts(retryOpts) : [];
};

/**
 * Err on the side of halting the generator after one call instead of
 * unexpectedly running it forever.
 */
Prankcall.defaultReceive = function*() {
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
