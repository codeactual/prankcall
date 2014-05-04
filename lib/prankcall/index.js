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

var requireComponent = require('../component/require');
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * Prankcall constructor.
 *
 * Usage:
 *
 *     var prankcall = Prankcall.create();
 *     prankcall.set('...', ...);
 *
 * Configuration:
 *
 * - `{type} [...=default]` ...
 *
 * Properties:
 *
 * - `{type} ...` ...
 */
function Prankcall() {
  this.settings = {
  };
}

configurable(Prankcall.prototype);
