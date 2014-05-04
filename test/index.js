var T = module.exports = {};

var sinon = require('sinon');
var chai = require('chai');

T.should = chai.should();
chai.config.includeStack = true;
chai.use(require('sinon-chai'));

require('sinon-doublist')(sinon, 'mocha');

T.requireComponent = require('../lib/component/require');

T.prankcall = require('../');
