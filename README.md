# AllianceExpressBackend

Backend for Alliance Express. TypeScript on Node, ESM, tested with Vitest.

## Prerequisites

- **Node.js 22 or newer** (npm ships with it). Check with `node -v` and `npm -v`.

## Setup

```powershell
# 1. Install dependencies
npm install

# 2. Create your local env file
Copy-Item .env.example .env

# 3. Confirm everything works
npm run typecheck
npm test
npm run dev
```

`npm run dev` starts the server on <http://localhost:3000>; hit it and you should get
`{"status":"ok"}`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs `src/index.ts` directly via tsx, restarting on file changes |
| `npm run build` | Cleans `dist/`, then compiles `src/` to `dist/` with `tsconfig.build.json` |
| `npm start` | Runs the compiled `dist/index.js` (run `build` first) |
| `npm run typecheck` | Type-checks `src/` **and** `tests/` without emitting anything |
| `npm test` | Runs the test suite once |
| `npm run test:watch` | Test watch mode |
| `npm run test:coverage` | Tests plus a coverage report (`text` + `coverage/index.html`) |
| `npm run clean` | Deletes `dist/` |

## Layout

```
src/
  index.ts        entry point — reads PORT, starts the server, handles shutdown
  server.ts       buildServer() returns the http.Server without listening
tests/
  server.test.ts  binds the server to a random port and asserts on the response
tsconfig.json         type-checking config, covers src + tests, emits nothing
tsconfig.build.json   build config, compiles src -> dist
vitest.config.ts      test runner config
.env.example          template for .env (which is gitignored)
.node-version         Node version for fnm / nvm / Volta to pick up
```

`server.ts` is split from `index.ts` on purpose: the tests need a server they can
start on an ephemeral port and shut down, which is awkward if the module calls
`listen()` as a side effect of being imported.

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push, on
pull requests into `main`, and on demand from the Actions tab. It installs with
`npm ci`, then runs typecheck → tests (with coverage) → build, and uploads the
coverage report as a build artifact.

Two things this depends on:

- **`package-lock.json` must be committed.** `npm ci` fails outright without it,
  and fails if it has drifted from `package.json`. Commit the lockfile whenever
  you change dependencies.
- **`.node-version` picks the CI Node version**, via `node-version-file`. Bump
  that file and CI follows automatically.

Build runs as its own step on purpose: `tsconfig.build.json` excludes `tests/`
and therefore resolves types differently, so it can fail when `typecheck` passes.
That exact failure already happened once during setup.

To make these checks blocking, go to **Settings → Branches → Add branch
ruleset** on `main` and require the `Typecheck, test, build` status check.

## Things worth knowing

**This is an ESM project** (`"type": "module"` in `package.json`). Two consequences:

1. Relative imports need the `.js` extension even though the file is `.ts` —
   `import { buildServer } from './server.js'`. That is what `module: "NodeNext"`
   expects, and it is what Node needs at runtime. TypeScript resolves it to the
   `.ts` source correctly.
2. There is no `require`, `__dirname`, or `__filename`. Use
   `import.meta.dirname` (Node 20.11+) if you need a path relative to the file.

**No path aliases are configured.** Aliases like `@/services/foo` need a runtime
resolver in addition to the tsconfig entry, or the compiled output breaks. If the
relative imports start to hurt, the cleanest fix is Node's native
[subpath imports](https://nodejs.org/api/packages.html#subpath-imports) via the
`imports` field in `package.json`.

**`types: ["node"]` is set explicitly in `tsconfig.json`** and must stay there.
Automatic `@types` discovery does not pick up `@types/node` in this setup, so
without it `src/` loses `process`, `console`, and the `node:*` modules. The
failure is easy to misread: `npm run typecheck` still passes, because it also
covers `tests/` and `vitest.config.ts`, which pull Node's types in
transitively — only `npm run build` breaks. If you add another ambient type
package (e.g. `@types/express`), append it to that array.

**`process.env` access uses bracket notation** (`process.env['PORT']`) because
`noUncheckedIndexedAccess` is on. That flag also means indexing an array gives you
`T | undefined` — it catches real bugs, but it is the strictness setting most
likely to feel noisy. It's in `tsconfig.json` if you want it gone.

## Not set up yet

Deliberately left out to keep this empty — add when needed:

- A web framework (Express, Fastify, Hono). Right now it's the bare `node:http` module.
- Linting and formatting (ESLint + Prettier, or Biome for a single-tool setup).
- A `.env` loader. Node 22 has `node --env-file=.env` built in, so you may not need `dotenv`.
- Database, migrations, Docker, CI.
