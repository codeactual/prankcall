var T = require('..');
var Prankcall = T.prankcall.Prankcall;
var sleep = Prankcall.sleep;
var http = require('http');
var request = require('co-request');

require('sinon-doublist-fs')('mocha');

describe('Prankcall - Examples', function(testDone) {
  'use strict';

  beforeEach(function() {
    this.prankcall = T.prankcall.create();
    this.portlandZip = 97204;
  });

  function getWeatherFromYahoo(location) {
    return function *getWeatherFromYahooGen() {
      var response = yield request('http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20location%20%3D%20' + location + '&format=json');
      return response.body;
    };
  }

  it('should demo single call', function *() {
    var fs = require('co-fs');
    var filename = '/tmp/weather-latest.json';
    var expectedJson;
    var producerGenFn = getWeatherFromYahoo(this.portlandZip);
    var consumerGenFn = function *(dataFromProducer) {
      expectedJson = dataFromProducer;
      yield fs.writeFile(filename, dataFromProducer);
    };
    yield this.prankcall.recv(consumerGenFn).send(producerGenFn);
    (yield fs.readFile(filename)).toString().should.equal(expectedJson);
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
