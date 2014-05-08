# Events

Subscribe through standard [EventEmitter](http://nodejs.org/api/events.html) API.

```js
var prankcall = require('prankcall').create();
prankcall.on('retry', cb);
```

## `call`

> Fires on before every call attempted by `send`.

Receives arguments:

- `{object}` Stats
  - `{number} calls` Total number of successful calls performed in `send`

## `return`

> Fires on after every successful call performed by `send`.

Receives arguments:

- `{object}` Stats
  - `{number} calls` Total number of successful calls performed in `send`
- `{mixed}` Value returned by the generator passed to `send`
