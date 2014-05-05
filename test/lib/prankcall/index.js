var T = require('../..');

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    this.producedData = [1, 2, 3];
  });

  it('should provide consumer with result', function *() {
    function *producer() {
      yield noOp();
      return this.producedData;
    }

    (yield T.prankcall.start(producer.bind(this))).should.deep.equal(this.producedData);
  });

  it.skip('should use default sleep', function *() {
  });

  it.skip('should use custom sleep', function *() {
  });

  it.skip('should use default timeout', function *() {
  });

  it.skip('should use custom timeout', function *() {
  });

  it.skip('should use no request params by default', function *() {
  });

  it.skip('should use custom request params', function *() {
  });

  it.skip('should use default backoff options', function *() {
  });

  it.skip('should use custom backoff options', function *() {
  });

  it.skip('should resume queue after backoff ends', function *() {
  });
});

function noOp() { return function(done) { done(); }; }
