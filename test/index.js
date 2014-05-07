var T = module.exports = {};

var sinon = require('sinon');
var chai = require('chai');

T.should = chai.should();
chai.config.includeStack = true;
chai.use(require('sinon-chai'));

require('sinon-doublist')(sinon, 'mocha');

T.requireComponent = require('../lib/component/require');

T.prankcall = require('../');

beforeEach(function() {
  this.expectedCallReturn = [1, 2, 3];
  this.generatorErrMsg = 'test generator error';
  this.generatorWithError = function *() {
    if (true) { // Hide the `throw` from jshint
      throw new Error(test.generatorErrMsg);
    }
    yield 'make jshint happy';
  };
  this.prankcall = T.prankcall.create();
  this.prankcall.set('sleep', 1);
});
