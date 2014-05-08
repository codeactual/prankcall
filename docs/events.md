# Events

Subscribe through standard [EventEmitter](http://nodejs.org/api/events.html) API.

```js
var prankcall = require('prankcall').create();
prankcall.on('retry', cb);
```

## `call`

> Fires before every call attempted by `send`.

Receives arguments:

- `{object}` Stats
  - `{number} calls` Total number of successful calls performed by current `send` run

## `return`

> Fires after every successful call performed by `send`.

Receives arguments:

- `{object}` Stats
  - `{number} calls` Total number of successful calls performed by current `send` run
- `{mixed}` Value returned by the generator passed to `send`

## `retry`

> Fires before every retry attempt performed by `send`. Preceeds the backoff delay.

Receives arguments:

- `{object}` Details
  - `{number} backoffTime` Milliseconds `send` will sleep before retrying
  - `{number} currentRetries` Number of times the generator passed to `send` has been retried by current `send` loop iteration
  - `{object} err` Caught exception
  - `{number} remainRetries` Number of remaining backoff timeouts
  - `{number} totalRetries` Total number of retries performed by current `send` run
