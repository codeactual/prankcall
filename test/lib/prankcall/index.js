var T = require('../..');
var co = require('co');
var sleep = T.prankcall.Prankcall.sleep;

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    var test = this;

    this.actualCallReturn = [];
    this.send = function *() {
      yield sleep(1);
      return test.expectedCallReturn[test.receiveCount];
    };
    this.receive = function *(callReturn) {
      yield sleep(1);
      test.actualCallReturn.push(callReturn);
      return test.receiveCount++ < test.expectedCallReturn.length - 1;
    };
    this.receiveWithoutReturn = function *(callReturn) {
      test.actualCallReturn.push(callReturn);
      yield sleep(1);
    };
    this.receiveCount = 0;
  });

  it('should provide receive with all results', function(testDone) {
    co(function *() {
      this.prankcall.receive(this.receive);
      yield this.prankcall.send(this.send);
      this.actualCallReturn.should.deep.equal(this.expectedCallReturn);
      testDone();
    }).call(this);
  });

  it('should propagate send exception', function() {
    this.prankcall.continueIf(this.receive);
    var gen = this.prankcall.start(this.sendWithError);
    //(function() {
      gen.next();
    //}).should.Throw(/failed to produce/);
  });

  it.skip('should handle error thrown from send', function() {
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
