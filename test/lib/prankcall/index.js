/*jshint expr:true*/
var sinon = require('sinon');
var chai = require('chai');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.config.includeStack = true;
chai.use(require('sinon-chai'));

var prankcall = require('../../..');

require('sinon-doublist')(sinon, 'mocha');

describe('Prankcall', function() {
  'use strict';

  beforeEach(function() {
    this.prankcall = new prankcall.create();
  });

  describe('#method', function() {
    it('should do something', function() {
      (true).should.be.ok;
    });
  });
});
