var T = require('../..');

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    var test = this;

    this.produced = [1, 2, 3];
    this.producer = function *() {
      for (var pos = 0; pos < test.produced.length; pos++) {
        yield test.produced[pos];
      }
    };
  });

  it('should emit producer results via #next', function() {
    var gen = T.prankcall.start(this.producer);
    var prod = gen.next();
    prod.value.should.equal(this.produced[0]);
    prod = gen.next();
    prod.value.should.equal(this.produced[1]);
    prod = gen.next();
    prod.value.should.equal(this.produced[2]);
    prod = gen.next();
    prod.done.should.be.ok;
  });

  it.skip('should use default timeout', function *() {
    yield true;
  });

  it.skip('should use custom timeout', function *() {
    yield true;
  });

  it.skip('should use no request params by default', function *() {
    yield true;
  });

  it.skip('should use custom request params', function *() {
    yield true;
  });

  it.skip('should use default backoff options', function *() {
    yield true;
  });

  it.skip('should use custom backoff options', function *() {
    yield true;
  });

  it.skip('should resume queue after backoff ends', function *() {
    yield true;
  });
});

function noOp() { return function(done) { done(); }; }
