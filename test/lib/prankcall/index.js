var T = require('../..');
var sleep = T.prankcall.Prankcall.sleep;

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    var test = this;

    // `this.send` will return one element at a time
    this.expectedCallReturn = [1, 2, 3];

    // To force retries
    this.sendErrMsg = 'test send error';
    this.sendWithError = function *() {
      if (true) { // Hide the `throw` from jshint
        throw new Error(test.sendErrMsg);
      }
      yield 'make jshint happy';
    };

    this.prankcall = T.prankcall.create();
    this.prankcall.set('sleep', 1);

    this.sendSpy = this.spy();

    // Stand-in for something async like an HTTP request
    this.send = function *() {
      test.sendSpy();
      yield sleep(1);
      return test.expectedCallReturn[test.recvCount];
    };

    // Store values passed to `this.recv`
    this.actualCallReturn = [];

    // Stand-in for something async, ex. write `this.send` results to DB
    this.recv = function *(callReturn) {
      yield sleep(1);
      test.actualCallReturn.push(callReturn);
      return test.recvCount++ < test.expectedCallReturn.length - 1;
    };

    // To verify devs can omit the final `return` safely (no infinite loop)
    this.recvWithoutReturn = function *(callReturn) {
      test.actualCallReturn.push(callReturn);
      yield sleep(1);
    };

    // Cursor used to read `this.expectedCallReturn` one element at a time
    this.recvCount = 0;
  });

  it('should call #send until #recv returns false', function *() {
    this.prankcall.recv(this.recv);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal(this.expectedCallReturn);
  });

  it('should call #send only once if using default #recv', function *() {
    yield this.prankcall.send(this.send);
    this.sendSpy.should.have.been.called.once;
  });

  it('should call #send only once if custom #recv returns undefined', function *() {
    this.prankcall.recv(this.recvWithoutReturn);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal([this.expectedCallReturn[0]]);
  });

  it('should propagate #send exception if retries exhausted', function *() {
    var actual;
    try {
      yield this.prankcall.send(this.sendWithError);
    } catch (err) {
      actual = err;
    }
    actual.message.should.equal(this.sendErrMsg);
  });

  it('should emit event: call', function *() {
    var actualStats;
    function onCall(stats) {
      actualStats = stats;
    }
    this.prankcall.on('call', onCall);
    yield this.prankcall.send(this.send);
    actualStats.should.deep.equal({calls: 0});
  });

  it.skip('should emit event: return', function *() {
    // Payload should include
    // - attempt #
    // - call return?
    yield true;
  });

  it.skip('should emit event: retry', function *() {
    // Payload should include
    // - attempt #
    // - retries used
    // - retries left
    // - error
    yield true;
  });

  it.skip('should emit event: sleep', function *() {
    // Payload should include
    // - attempt #
    // - sleep duration
    yield true;
  });

  it.skip('should recover from sparse #send exceptions', function *() {
    this.prankcall.retry({retries: 3});
    var successSequence = [true, false, false, true, false, true];
    yield this.prankcall.send(this.sendWithError);
    this.actualCallReturn.should.deep.equal([this.expectedCallReturn[0]]);
  });

  it.skip('should use default retry options', function *() {
    yield true;
  });

  it.skip('should reset retries after #send success', function *() {
    // Set max failures to 3, failure a total of 4 times in run:
    // - ex. success + 2 failures + success + 2 failures + success
    // Verify collected call return values
    // Use events to collect retry states
    yield true;
  });

  it.skip('should use default retry options', function *() {
    yield true;
  });

  it.skip('should use custom retry options', function *() {
    yield true;
  });

  it.skip('should use default sleep', function *() {
    yield true;
  });

  it.skip('should use custom sleep', function *() {
    yield true;
  });
});

function noOp() { return function(done) { done(); }; }
