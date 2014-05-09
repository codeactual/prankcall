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
  });

  function getWeatherFromYahoo(location) {
    return function *getWeatherFromYahooGen() {
      var response = yield request('http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20location%20%3D%20' + location + '&format=json');
      return response.body;
    };
  }

  it('should demo single call', function *() {
    var fs = require('co-fs');
    var expectedJson;

    var filename = '/tmp/weather/latest.json';
    this.stubTree(filename);

    var producerGenFn = getWeatherFromYahoo(97204);

    var consumerGenFn = function *(dataFromProducer) {
      expectedJson = dataFromProducer;
      yield fs.writeFile(filename, dataFromProducer);
    };

    yield this.prankcall.recv(consumerGenFn).send(producerGenFn);

    (yield fs.readFile(filename)).toString().should.equal(expectedJson);
  });

  it('should demo producer dynamically stopped by consumer', function *() {
    var maxIter = 100;
    var curIter = 0;

    function *producer() {
      yield sleep(0);
      curIter++;
      return '';
    }

    function *consumer() {
      yield sleep(0);
      return curIter < maxIter;
    }

    this.prankcall.sleep(0);
    yield this.prankcall.recv(consumer).send(producer);

    curIter.should.equal(maxIter);
  });
});
