var T = require('../..');
var sleep = T.prankcall.Prankcall.sleep;

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    var test = this;

    // `this.send` will return one element at a time
    this.expectedCallReturn = [1, 2, 3];

    // To force retries
    this.generatorErrMsg = 'test generator error';
    this.generatorWithError = function *() {
      if (true) { // Hide the `throw` from jshint
        throw new Error(test.generatorErrMsg);
      }
      yield 'make jshint happy';
    };

    this.prankcall = T.prankcall.create();
    this.prankcall.set('sleep', 1);

    // Stand-in for something async like an HTTP request
    this.send = function *() {
      yield sleep(1);
      return test.expectedCallReturn[test.receiveCount];
    };

    // Store values passed to `this.receive`
    this.actualCallReturn = [];

    // Stand-in for something async, ex. write `this.send` results to DB
    this.receive = function *(callReturn) {
      yield sleep(1);
      test.actualCallReturn.push(callReturn);
      return test.receiveCount++ < test.expectedCallReturn.length - 1;
    };

    // To verify devs can omit the final `return` safely (no infinite loop)
    this.receiveWithoutReturn = function *(callReturn) {
      test.actualCallReturn.push(callReturn);
      yield sleep(1);
    };

    // Cursor used to read `this.expectedCallReturn` one element at a time
    this.receiveCount = 0;
  });

  it('should call #send until #receive returns false', function *() {
    this.prankcall.receive(this.receive);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal(this.expectedCallReturn);
  });

  it('should call #send only once if #receive returns undefined', function *() {
    this.prankcall.receive(this.receiveWithoutReturn);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal([this.expectedCallReturn[0]]);
  });

  it.skip('should propagate #send exception', function *() {
    yield true;
  });

  it.skip('should handle error thrown from send', function *() {
    yield true;
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
