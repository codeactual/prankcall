
;(function(){

/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("codeactual~require-component@0.1.0", function (exports, module) {
/**
 * require() components from outside the build
 *
 * Licensed under MIT.
 * Copyright (c) 2014 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

module.exports = function(require) {
  function requireComponent(shortName) {
    var found;
    Object.keys(require.modules).forEach(function findComponent(fullName) {
      if (found) {
        return;
      }
      if (new RegExp('~' + shortName + '@').test(fullName)) {
        found = fullName;
      }
    });
    if (found) {
      return require(found);
    } else {
      return require(shortName); // Let it fail with some context
    }
  }
  return {
    requireComponent: requireComponent
  };
};

});

require.register("codeactual~extend@0.1.0", function (exports, module) {

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
});

require.register("visionmedia~configurable.js@f87ca5f", function (exports, module) {

/**
 * Make `obj` configurable.
 *
 * @param {Object} obj
 * @return {Object} the `obj`
 * @api public
 */

module.exports = function(obj){

  /**
   * Mixin settings.
   */

  obj.settings = {};

  /**
   * Set config `name` to `val`, or
   * multiple with an object.
   *
   * @param {String|Object} name
   * @param {Mixed} val
   * @return {Object} self
   * @api public
   */

  obj.set = function(name, val){
    if (1 == arguments.length) {
      for (var key in name) {
        this.set(key, name[key]);
      }
    } else {
      this.settings[name] = val;
    }

    return this;
  };

  /**
   * Get setting `name`.
   *
   * @param {String} name
   * @return {Mixed}
   * @api public
   */

  obj.get = function(name){
    return this.settings[name];
  };

  /**
   * Enable `name`.
   *
   * @param {String} name
   * @return {Object} self
   * @api public
   */

  obj.enable = function(name){
    return this.set(name, true);
  };

  /**
   * Disable `name`.
   *
   * @param {String} name
   * @return {Object} self
   * @api public
   */

  obj.disable = function(name){
    return this.set(name, false);
  };

  /**
   * Check if `name` is enabled.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */

  obj.enabled = function(name){
    return !! this.get(name);
  };

  /**
   * Check if `name` is disabled.
   *
   * @param {String} name
   * @return {Boolean}
   * @api public
   */

  obj.disabled = function(name){
    return ! this.get(name);
  };

  return obj;
};
});

require.register("prankcall", function (exports, module) {
module.exports = require("codeactual~require-component@0.1.0")(require);

});

if (typeof exports == "object") {
  module.exports = require("prankcall");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("prankcall"); });
} else {
  this["prankcall"] = require("prankcall");
}
})()
