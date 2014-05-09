# prankcall

Call a node.js generator with backoff and other customization

- Configure exponential backoff via [node-retry](https://github.com/tim-kos/node-retry#api) options
- Call the generator just once or repeatedly based on custom logic
- Optionally define another generator to receive results
- Sleep between successful calls
- Combine with modules like:
  - [co](https://github.com/visionmedia/co)
  - [co-request](https://github.com/leukhin/co-request)
- Observe retry events for logging

[![Build Status](https://travis-ci.org/codeactual/prankcall.png)](https://travis-ci.org/codeactual/prankcall)

## Example

> Use an async `producer` to generate input for an async `consumer`.
> `producer` might perform an HTTP request, while `consumer` stores the result in a database, job queue, etc.

```js
function *producer() {
  var data = yield producerWork();
  // ...
  return data;
}

function *consumer(dataFromProducer) {
  yield consumerWork(dataFromProducer);
  return shouldProducerRunAgain(); // {boolean}
}

co(function *() {
  var prankcall = require('./index').create();
  yield prankcall
    .sleep(1500) // Wait 1.5s after each successful `producer` call
    .retry({
      retries: 5,
      factor: 3,
      minTimeout: 1 * 1000,
      maxTimeout: 60 * 1000,
      randomize: true
    })
    .recv(consumer);
    .send(producer);
})();
```

See more [examples](blob/master/test/lib/examples.js).

## Installation

### [NPM](https://npmjs.org/package/prankcall)

    npm install prankcall

## API

- [Documentation](docs/Prankcall.md)
- [Events](docs/events.md)

## License

  MIT

## Tests

    npm test
