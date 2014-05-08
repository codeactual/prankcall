var T = require('..');
var Prankcall = T.prankcall.Prankcall;
var sleep = Prankcall.sleep;

describe('Prankcall - Examples', function(testDone) {
  'use strict';

  beforeEach(function() {
    this.prankcall = T.prankcall.create();
  });

  it.skip('should demo single call with default sleep and backoff', function *() {
    yield this.prankcall.send(this.send);
  });

  it.skip('should demo infinite calls with custom sleep and backoff', function *() {
    yield this.prankcall.send(this.send);
  });

  it.skip('should demo infinite producer-consumer flow', function *() {
    yield this.prankcall.send(this.send);
  });

  it.skip('should demo consumer ending a flow', function *() {
    yield this.prankcall.send(this.send);
  });
});
