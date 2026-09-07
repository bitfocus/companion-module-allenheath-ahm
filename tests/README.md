# Automated tests

Run `yarn install --frozen-lockfile`, then `yarn test` with Node 22.18 or newer in the Node 22 line (matching the module tools).

- `state.test.js`: channel/send subscriptions, feedback movement, manual tracking, partial updates and reset.
- `polling.test.js`: request bytes and priority, periodic timing, slow queue drain, manual poll coalescing, disconnect and stop behavior. Uses Node's mock timers; its experimental API warning on Node 22 is expected. Each test owns its context and timer cleanup.
- `transport.test.js`: the real module TCP client and TCPHelper, connected only to an ephemeral loopback server on `127.0.0.1`. Checks byte ordering, priority, queue cancellation, idle waiters and disconnect notification. No AHM or external network access is required.

These are software regression tests, not hardware validation or a complete protocol conformance suite. They do not validate firmware behavior, audio, or every MIDI response parser case. The `.companionconfig` files in this directory remain available for manual hardware tests.
