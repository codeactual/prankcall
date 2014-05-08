var T = require('../..');
var sleep = T.prankcall.Prankcall.sleep;

describe('Prankcall', function(testDone) {
  'use strict';

  beforeEach(function() {
    var test = this;

    // `this.send` will return one element at a time
    this.expectedCallReturn = ['one', 2, {three: true}];

    // To force retries
    this.sendErrMsg = 'test send error';
    this.sendErr = new Error(this.sendErrMsg);
    this.sendWithError = function *() {
      if (true) { // Hide the `throw` from jshint
        throw test.sendErr;
      }
      yield 'make jshint happy';
    };

    this.sleepTime = 1;

    this.prankcall = T.prankcall.create();
    this.prankcall.set('sleep', this.sleepTime);

    this.sendSpy = this.spy();

    // Stand-in for something async like an HTTP request
    this.send = function *() {
      test.sendSpy();
      yield sleep(test.sleepTime);
      return test.expectedCallReturn[test.recvCount];
    };

    // Store values passed to `this.recv`
    this.actualCallReturn = [];

    // Stand-in for something async, ex. write `this.send` results to DB
    this.recv = function *(callReturn) {
      yield sleep(test.sleepTime);
      test.actualCallReturn.push(callReturn);
      return test.recvCount++ < test.expectedCallReturn.length - 1;
    };

    // To verify devs can omit the final `return` safely (no infinite loop)
    this.recvWithoutReturn = function *(callReturn) {
      test.actualCallReturn.push(callReturn);
      yield sleep(test.sleepTime);
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
    actual.should.equal(this.sendErr);
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

  it('should emit event: return', function *() {
    var actualStats;
    var actualCallReturn;

    function onReturn(stats, callReturn) {
      actualStats = stats;
      actualCallReturn = callReturn;
    }

    this.prankcall.on('return', onReturn);

    yield this.prankcall.send(this.send);

    actualStats.should.deep.equal({calls: 1});
    actualCallReturn.should.equal(this.expectedCallReturn[0]);
  });

  it('should emit event: retry', function *() {
    var actualDetails = [];

    function onRetry(details) {
      actualDetails.push(details);
    }

    this.prankcall.on('retry', onRetry);
    this.prankcall.retry({retries: 3});

    var caughtErr;
    try {
      yield this.prankcall.send(this.sendWithError);
    } catch (err) {
      caughtErr = err;
    }

    caughtErr.should.equal(this.sendErr);
    actualDetails.length.should.equal(3);
    actualDetails[0].should.deep.equal({
      backoffTime: 1000,
      currentRetries: 1,
      err: this.sendErr,
      remainRetries: 2,
      totalRetries: 1
    });
    actualDetails[1].should.deep.equal({
      backoffTime: 2000,
      currentRetries: 2,
      err: this.sendErr,
      remainRetries: 1,
      totalRetries: 2
    });
    actualDetails[2].should.deep.equal({
      backoffTime: 4000,
      currentRetries: 3,
      err: this.sendErr,
      remainRetries: 0,
      totalRetries: 3
    });
  });

  it('should recover from sparse #send exceptions', function *() {
    var test = this;
    var successSequence = [true, false, false, true, false, false, true];
    var actualRetryDetails = [];

    function onRetry(details) {
      actualRetryDetails.push(details);
    }

    function *send() {
      if (!successSequence.shift()) {
        throw test.sendErr;
      }
      yield sleep(test.sleepTime);
      return test.expectedCallReturn[test.recvCount];
    }

    this.prankcall.on('retry', onRetry);
    this.prankcall.recv(this.recv);
    this.prankcall.retry({retries: 3});

    yield this.prankcall.send(send);

    actualRetryDetails.length.should.equal(4);
    this.actualCallReturn.should.deep.equal(this.expectedCallReturn);
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
