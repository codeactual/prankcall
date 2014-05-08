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

    this.sendSpy = this.spy();

    // Stand-in for something async like an HTTP request
    this.send = function *() {
      test.sendSpy();
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

  it('should call #send only once if using default #receive', function *() {
    yield this.prankcall.send(this.send);
    this.sendSpy.should.have.been.called.once;
  });

  it('should call #send only once if custom #receive returns undefined', function *() {
    this.prankcall.receive(this.receiveWithoutReturn);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal([this.expectedCallReturn[0]]);
  });

  it.skip('should propagate #send exception if retry disabled', function *() {
    yield true;
  });

  it.skip('should recover from sparse #send exceptions', function *() {
    // success + 2 failures + success + failure + success
    // Verify collected call return values
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

  it.skip('should emit event: call', function *() {
    // Payload should include
    // - attempt #
    // Emit right before yielding to sender, outside try/catch
    yield true;
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
});

function noOp() { return function(done) { done(); }; }
