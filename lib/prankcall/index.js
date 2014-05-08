/**
 * Call a generator with backoff and other customization
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
 *   - `{number} [minTimeout=1000]`
 *   - `{number} [maxTimeout=Infinity]`
 *   - `{boolean} [randomize=false]`
 * - `{function *} [receive=none]` Optional consumer of each call's return value
 *   - `return true` to make another call
 *   - `return <falsey>` stop calling
 * - `{number} [sleep=1000]` Delay (in milliseconds) after successful call
 * @see tim-kos/node-retry https://github.com/tim-kos/node-retry/#api
 * @see Events docs/Events.md
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

/**
 * Define a generator to receive the return values from the generator
 * passed to Prankcall.prototype.send.
 *
 * - Ex. to implement pagination by inspecting JSON responses from HTTP requests
 *   and then deciding whether to `send` should run again to fetch the next page.
 *   `recv` can signal `send` to continue/stop its loop by returning `true/false`.
 *
 * @param {function *} recv
 * @return {object} this
 */
Prankcall.prototype.recv = function(recv) {
  return this.set('recv', recv);
};

/**
 * Customize `retry` timeout options for backoff in `send`.
 *
 * @param {object} options Any valid `retry` timeout pairs
 * @return {object} this
 * @see tim-kos/node-retry https://github.com/tim-kos/node-retry/#api
 */
Prankcall.prototype.retry = function(options) {
  return this.set('retry', options);
};

/**
 * Sleep for a custom duration after each `send` iteration.
 *
 * @param {number} ms
 * @return {object} this
 */
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
  var callReturn; // `return` value from `sender`
  var sleep = Prankcall.sleep;
  var stats = {
    calls: 0,
    currentRetries: 0,
    totalRetries: 0
  };
  var timeouts = this.calcTimeouts();

  // Block executes on:
  // - 1st run
  // - Retry
  // - Receiver generator returned `true`, see `this.get('recv')` below
  while (callAgain) {
    try {
      this.emit('call', {calls: stats.calls});

      callReturn = yield sender();

      stats.calls++;
      this.emit('return', {calls: stats.calls}, callReturn);
    } catch (err) {
      backoffTime = timeouts.shift();
      if (backoffTime === undefined) { // Retries exhausted
        throw err;
      } else {
        stats.currentRetries++;
        stats.totalRetries++;
        this.emit(
          'retry',
          {
            backoffTime: backoffTime,
            remainRetries: timeouts.length,
            currentRetries: stats.currentRetries,
            err: err,
            totalRetries: stats.totalRetries
          },
          err
        );
        yield Prankcall.backoff(backoffTime);
        continue;
      }
    }

    callAgain = !!(yield this.get('recv')(callReturn));

    if (callAgain) {
      // Reset per-iteration states
      stats.currentRetries = 0;
      timeouts = this.calcTimeouts();

      this.emit('next', {sleepTime: callAgainSleep});

      if (callAgainSleep) {
        yield sleep(callAgainSleep);
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

/**
 * Separate from Prankcall.sleep to allow separate test doubles.
 */
Prankcall.backoff = function(ms) {
  return function prankCallBackoff(done) {
    setTimeout(done, ms);
  };
};

Prankcall.sleep = function(ms) {
  return function prankCallSleep(done) {
    setTimeout(done, ms);
  };
};
