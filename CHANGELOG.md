# 0.2.1

- fix(es6): const violations

# 0.2.0

## breaking

- refactor(node): Migrate to ES6 features like `let` and `const`
  - Switch to `iojs` as only build target

## non-breaking

- refactor(extend): from migrate [assimlate](https://github.com/pluma0/assimilate) to [extend](https://github.com/justmoon/node-extend/)

# 0.1.3

- refactor(lib,test): remove isGeneratorFunction, works w/out those checks

# 0.1.2

- chore(npm): No changes, 0.1.1 publish appeared incomplete

# 0.1.1

- feat(recv): Support regular consumer functions
- docs(Prankcall): Mark #calcTimeouts as private for docs

# 0.1.0

- Initial API: `send`, `recv`, `sleep`, `retry`
- Initial events: `call`, `return`, `retry`
