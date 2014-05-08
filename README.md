# prankcall

Call a generator with backoff and other customization

- Configure exponential backoff via [node-retry](https://github.com/tim-kos/node-retry#api) options
- Call the generator just once or repeatedly based on custom logic
- Optionally define another generator to receive results
- Sleep between successful calls
- Combine with modules like [co](https://github.com/visionmedia/co)

[![Build Status](https://travis-ci.org/codeactual/prankcall.png)](https://travis-ci.org/codeactual/prankcall)

## Examples

### Call a generator only once

> With default sleep and backoff options

```js
function *asyncWork() {
  var data = yield work();
  // ...
  return data;
}

co(function *() {
  var prankcall = require('./index').create();
  yield prankcall.send(asyncWork);
})();
```

### Collect hourly search results from an HTTP API and queue processing jobs

> With custom sleep and backoff options

```js
co(function *() {
  var pageSize = 20;
  var offset = 0;

  function buildSearchGenerator(term) {
    return function *() {
      var url = buildRequestUrl(term, offset, pageSize);
      var response = yield request(url);
      return response.results;
    };
  }

  function *queueResultsForProcessing(results) {
    if (results.length) {
      yield enqueue(results);
    }

    offset += pageSize;

    // `false` will stop `send()` iteration
    return results.length === pageSize;
  }

  var prankcall = require('prankcall').create();
  prankcall.on('retry', function() {
    console.error('retry', arguments);
  });
  yield prankcall
    .sleep(3600 * 1000)
    .retry({retries: 3, randomize: true})
    .recv(queueResultsForProcessing)
    .send(buildSearchGenerator('#nodejs'));
})();
```

## Installation

### [NPM](https://npmjs.org/package/prankcall)

    npm install prankcall

## API

[Documentation](docs/Prankcall.md)
[Events](docs/events.md)

## License

  MIT

## Tests

    npm test
