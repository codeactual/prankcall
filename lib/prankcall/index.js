/**
 * Call a node.js generator with backoff and other customization
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
exports.create = function create() { return new Prankcall(); };

/**
 * Extend Prankcall.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function extendProto(ext) { return extend(Prankcall.prototype, ext); };

const events = require('events');
const retry = require('retry');
const util = require('util');

const extend = require('extend');
const configurable = require('configurable');

/**
 * Prankcall constructor.
 *
 * Usage:
 *
 *     const prankcall = require('prankcall').create();
 *     prankcall.retry({retries: 3}); // `retry` options
 *
 *     const send = function *() {
 *        // ... async read ...
 *        return data;
 *     };
 *     const recv = function *() {
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
 * @see Events https://github.com/codeactual/prankcall/blob/master/docs/events.md
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
 * Define a generator, or regular function, to receive the return values from
 * the generator passed to Prankcall.prototype.send.
 *
 * - Ex. to implement pagination by inspecting JSON responses from HTTP requests
 *   and then deciding whether to `send` should run again to fetch the next page.
 *   `recv` can signal `send` to continue/stop its loop by returning `true/false`.
 *
 * @param {function *} recv Generator or regular function.
 * - Receives the return value from `send` as the first argument.
 * @return {object} this
 */
Prankcall.prototype.recv = function recv(recv) {
  return this.set('recv', recv);
};

/**
 * Customize `retry` timeout options for backoff in `send`.
 *
 * @param {object} options Any valid `retry` timeout pairs
 * @return {object} this
 * @see tim-kos/node-retry https://github.com/tim-kos/node-retry/#api
 */
Prankcall.prototype.retry = function retry(options) {
  return this.set('retry', options);
};

/**
 * Sleep for a custom duration after each `send` iteration.
 *
 * @param {number} ms
 * @return {object} this
 */
Prankcall.prototype.sleep = function sleep(ms) {
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
Prankcall.prototype.send = function *send(sender) {
  let backoffTime;
  let callAgain = true;
  const callAgainSleep = this.get('sleep');
  let callReturn; // `return` value from `sender`
  const sleep = Prankcall.sleep;
  const stats = {
    calls: 0,
    currentRetries: 0,
    totalRetries: 0
  };
  const timeouts = this.calcTimeouts();
  const recv = this.get('recv');

  // Block executes on:
  // - 1st run
  // - Retry
  // - Receiver function returned `true`, see `this.get('recv')` below
  while (callAgain) {
    try {
      this.emit('call', {calls: stats.calls});

      callReturn = yield sender();

      stats.calls++;
      this.emit('return', {calls: stats.calls}, callReturn);
    } catch (err) {
      backoffTime = timeouts.shift();
      if (typeof backoffTime === 'undefined') { // Retries exhausted
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
          }
        );
        yield Prankcall.backoff(backoffTime);
        continue;
      }
    }

    callAgain = !!(yield recv(callReturn));

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
 * @api private
 */
Prankcall.prototype.calcTimeouts = function calcTimeouts() {
  const retryOpts = this.get('retry');
  return typeof retryOpts === 'object' ? retry.timeouts(retryOpts) : [];
};

/**
 * Err on the side of halting the generator after one call instead of
 * unexpectedly running it forever.
 */
Prankcall.defaultReceive = function defaultReceive() {
  return false;
};

Prankcall.noOpCallback = function noOpCallback(done) {
  done();
};

/**
 * Separate from Prankcall.sleep to allow separate test doubles.
 */
Prankcall.backoff = function backoff(ms) {
  return function prankCallBackoff(done) {
    setTimeout(done, ms);
  };
};

Prankcall.sleep = function sleep(ms) {
  return function prankCallSleep(done) {
    setTimeout(done, ms);
  };
};
