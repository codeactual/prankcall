/*eslint func-names: 0, new-cap: 0, no-unused-expressions: 0, no-wrap-func: 0*/
'use strict';

const T = require('..');
const Prankcall = T.prankcall.Prankcall;
const sleep = Prankcall.sleep;
const request = require('co-request');

require('sinon-doublist-fs')('mocha');

describe('Prankcall - Examples', function() {
  beforeEach(function() {
    this.prankcall = T.prankcall.create();
  });

  function getWeatherFromYahoo(location) {
    return function *getWeatherFromYahooGen() {
      const response = yield request('http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20location%20%3D%20' + location + '&format=json');
      return response.body;
    };
  }

  it('should demo single call', function *() {
    const fs = require('co-fs');
    let expectedJson;

    const filename = '/tmp/weather/latest.json';
    this.stubTree(filename);

    const producerGenFn = getWeatherFromYahoo(97204);

    const consumerGenFn = function *(dataFromProducer) {
      expectedJson = dataFromProducer;
      yield fs.writeFile(filename, dataFromProducer);
    };

    yield this.prankcall.recv(consumerGenFn).send(producerGenFn);

    (yield fs.readFile(filename)).toString().should.equal(expectedJson);
  });

  it('should demo producer dynamically stopped by consumer', function *() {
    const maxIter = 100;
    const curIter = 0;

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
