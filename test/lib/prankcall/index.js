var T = require('../..');

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    var test = this;
    var pos = 0;

    this.produced = [1, 2, 3];

    this.producer = function *() {
      yield test.produced[pos++];
    };
    this.contIf = function(prod) {
      return pos < test.produced.length;
    };
    this.producerWithError = function *() {
      if (true) { // Hide the `throw` from jshint
        throw new Error('failed to produce');
      }
      yield 'never happens';
    };

    this.prankcall = T.prankcall.create();
  });

  it('should emit producer results via #next', function() {
    this.prankcall.continueIf(this.contIf);
    var gen = this.prankcall.start(this.producer);
    var prod = gen.next();
    prod.value.should.equal(this.produced[0]);
    prod = gen.next();
    prod.value.should.equal(this.produced[1]);
    prod = gen.next();
    prod.value.should.equal(this.produced[2]);
    prod = gen.next();
    prod.done.should.be.ok;
  });

  it('should propagate producer exception', function() {
    this.prankcall.continueIf(this.contIf);
    var gen = this.prankcall.start(this.producerWithError);
    (function() {
      gen.next();
    }).should.Throw(/failed to produce/);
  });

  it.skip('should handle error thrown from producer', function() {
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

  it.skip('should use default backoff options', function() {
    // Make PrankCall class an event emitter
    // Use events to count the retries
  });

  it.skip('should use custom backoff options', function *() {
    yield true;
  });

  it.skip('should resume queue after backoff ends', function *() {
    yield true;
  });
});

function noOp() { return function(done) { done(); }; }
