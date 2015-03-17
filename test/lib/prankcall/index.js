/*eslint func-names: 0, new-cap: 0, no-unused-expressions: 0, no-wrap-func: 0*/
var T = require('../..');
var Prankcall = T.prankcall.Prankcall;
var sleep = Prankcall.sleep;
var retry = require('retry');

describe('Prankcall - Lib', function() {
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
    this.fakeAsyncDelay = 3;

    this.defaultReceiveSpy = this.spy(Prankcall, 'defaultReceive');

    this.prankcall = T.prankcall.create();
    this.prankcall.set('sleep', this.sleepTime);

    this.sendSpy = this.spy();

    // Stand-in for something async like an HTTP request
    this.send = function *() {
      test.sendSpy();
      yield sleep(test.fakeAsyncDelay);
      return test.expectedCallReturn[test.recvCount];
    };

    // Store values passed to `this.recv`
    this.actualCallReturn = [];

    // Stand-in for something async, ex. write `this.send` results to DB
    this.recv = function *(callReturn) {
      yield sleep(test.fakeAsyncDelay);
      test.actualCallReturn.push(callReturn);
      return test.recvCount++ < test.expectedCallReturn.length - 1;
    };

    // To verify devs can omit the final `return` safely (no infinite loop)
    this.recvWithoutReturn = function *(callReturn) {
      test.actualCallReturn.push(callReturn);
      yield sleep(test.fakeAsyncDelay);
    };

    // Cursor used to read `this.expectedCallReturn` one element at a time
    this.recvCount = 0;

    this.useFakeBackoff = function() {
      test.stub(Prankcall, 'backoff', function() {
        return Prankcall.noOpCallback;
      });
    };

    this.nonGeneratorMultiIterRecv = function(callReturn) {
      actualCallReturn.push(callReturn);
      return test.recvCount++ < test.expectedCallReturn.length - 1;
    }

    this.nonGeneratorOneIterRecv = function(callReturn) {
      actualCallReturn.push(callReturn);
      return false;
    }

    this.nonGeneratorSend = function() {
      test.sendSpy();
      return test.expectedCallReturn[test.recvCount];
    };
  });

  it('should call #send until #recv returns false', function *() {
    this.prankcall.recv(this.recv);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal(this.expectedCallReturn);
  });

  it('should call #send only once if using default #recv', function *() {
    yield this.prankcall.send(this.send);
    this.sendSpy.should.have.been.calledOnce;
    this.defaultReceiveSpy.should.have.been.calledOnce;
  });

  it('should call #send only once if custom #recv returns undefined', function *() {
    this.prankcall.recv(this.recvWithoutReturn);
    yield this.prankcall.send(this.send);
    this.actualCallReturn.should.deep.equal([this.expectedCallReturn[0]]);
  });

  it('should propagate #send exception if retries exhausted', function *() {
    this.useFakeBackoff();

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
    this.useFakeBackoff();

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
    this.useFakeBackoff();

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

  it('should use default retry options', function *() {
    var spy = this.spy(retry, 'timeouts');

    yield this.prankcall.send(this.send);

    spy.should.have.been.calledWithExactly({});
  });

  it('should produce default timeout durations', function() {
    this.prankcall.calcTimeouts().should.deep.equal(
      [1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000]
    );
  });

  it('should use custom retry options', function *() {
    var spy = this.spy(retry, 'timeouts');

    var custom = {
      timeout: 101,
      retries: 5,
      factor: 2.1,
      minTimeout: 2000,
      maxTimeout: 60000
    };
    this.prankcall.retry(custom);
    yield this.prankcall.send(this.send);

    spy.should.have.been.calledWithExactly(custom);
  });

  it('should use default sleep time', function *() {
    var spy = this.spy(GLOBAL, 'setTimeout');
    this.prankcall.recv(this.recv);
    yield this.prankcall.send(this.send);
    spy.args[0][1].should.equal(this.fakeAsyncDelay);
    spy.args[1][1].should.equal(this.fakeAsyncDelay);
    spy.args[2][1].should.equal(this.sleepTime);
    spy.args[3][1].should.equal(this.fakeAsyncDelay);
    spy.args[4][1].should.equal(this.fakeAsyncDelay);
    spy.args[5][1].should.equal(this.sleepTime);
    spy.args[6][1].should.equal(this.fakeAsyncDelay);
    spy.args[7][1].should.equal(this.fakeAsyncDelay);
  });

  it('should use custom sleep time', function *() {
    var spy = this.spy(GLOBAL, 'setTimeout');
    var custom = 33;
    this.prankcall.sleep(custom);
    this.prankcall.recv(this.recv);
    yield this.prankcall.send(this.send);
    spy.args[0][1].should.equal(this.fakeAsyncDelay); // send
    spy.args[1][1].should.equal(this.fakeAsyncDelay); // recv
    spy.args[2][1].should.equal(custom);              // sleep
    spy.args[3][1].should.equal(this.fakeAsyncDelay); // send
    spy.args[4][1].should.equal(this.fakeAsyncDelay); // recv
    spy.args[5][1].should.equal(custom);              // sleep
    spy.args[6][1].should.equal(this.fakeAsyncDelay); // send
    spy.args[7][1].should.equal(this.fakeAsyncDelay); // recv
  });

  it('should perform sleep', function() {
    var clock = this.sandbox.useFakeTimers();
    var ms = 86400;
    var thunk = sleep(ms);
    var spy = this.spy();
    thunk(spy);
    clock.tick(86399);
    spy.should.not.have.been.called;
    clock.tick(1);
    spy.should.have.been.called;
  });

  it('should pass call return values to non-generator #recv', function *() {
    var actualCallReturn = [];

    this.prankcall.recv(this.nonGeneratorMultiIterRecv.bind(this));
    yield this.prankcall.send(this.send);
    actualCallReturn.should.deep.equal(this.expectedCallReturn);
  });

  it('should call #send only once if custom non-generator #recv returns false', function *() {
    var actualCallReturn = [];

    this.prankcall.recv(this.recv);
    yield this.prankcall.send(this.send);
    actualCallReturn.should.deep.equal([this.expectedCallReturn[0]]);
  });

  it('should support non-generator used in #send', function *() {
    var actualCallReturn = [];

    this.prankcall.recv(this.recv);
    yield this.prankcall.send(this.nonGeneratorSend.bind(this));
    actualCallReturn.should.deep.equal(this.expectedCallReturn);
  });
});
