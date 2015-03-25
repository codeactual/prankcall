module.exports = function exports(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('initConfig.projName', 'prankcall')
    .demand('initConfig.klassName', 'Prankcall')
    .demand('initConfig.instanceName', 'prankcall')
    .loot('node-component-grunt')
    .loot('node-lib-grunt')
    .loot('./config/grunt')
    .attack();
};
