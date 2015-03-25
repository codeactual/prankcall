const T = module.exports = {};

const sinon = require('sinon');
const chai = require('chai');

T.should = chai.should();
chai.config.includeStack = true;
chai.use(require('sinon-chai'));

require('sinon-doublist')(sinon, 'mocha');

T.prankcall = require('../');
