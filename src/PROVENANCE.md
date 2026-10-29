# Subscriptions provenance

- Source: https://github.com/V1ki/dsh-plugin-subscriptions
- Version: v0.9.12
- Commit: b802311
- License: MIT (copyright notice retained below).
- Scope carried over in #128: host exact Fetch RPC envelope/registration convention from src/auth/rpc.ts and browser closure-factory build recipe from tsdown.config.ts; no provider implementation.

## Every local change so far

- Reduced host behavior to one presence endpoint, majed-subscriptions.status; no accounts, storage, tools, adapters or credentials.
- Structural minimal host service types instead of reference dependencies.
- Presence response contains component identity and package version.
- Invalid envelopes receive HTTP 400; no provider dispatch/business errors.
- Host emitted by TypeScript to dist instead of lib.
- Browser closure factory is embedded inside the existing core factory in dist/client.js, the sole browser half; no second loader registration or runtime cross-package require.
- Browser settings and presence lifecycle implemented independently: one empty two-part section, polling/reconnect reconciliation, disposal and English/Arabic copy.
- Reference external module list retained; no provider wire imports, source maps, declaration emission or purity plugin needed in this presence-only slice.

## License

MIT License

Copyright (c) 2026 V1ki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
