# AGENTS.md

## Repo overview

Static landing page (`public/`) + a single Firebase Function (`functions/`) that generates PNG avatars on demand. No monorepo tooling; the two parts are independent and deployed separately.

## Directory layout

```
public/          # Landing page (genavatar.me) — plain HTML/CSS, no build step
functions/       # Firebase Function source (TypeScript, Node 22)
  src/
    index.ts     # Single exported function: `id`
    _lib/
      index.ts   # createFace() + combine() using sharp
      _img/      # SVG/PNG asset files for eyes/, nose/, mouth/
  lib/           # Compiled output — NOT committed, produced by build
```

`functions/public/` (hosting target `api-genavatar`) is produced implicitly by Firebase; rewrites route `**` to the `id` function.

## Working in `functions/`

**Package manager: pnpm.** Do not use `npm` — there is no `package-lock.json`. All commands must be run from the `functions/` directory.

```bash
# Install
pnpm install

# Build (clean + tsc + copy image assets to lib/)
pnpm run build

# Build is required before deploy; predeploy hook in firebase.json runs it automatically
pnpm run deploy          # functions only
firebase deploy --only hosting:landing   # public/ only
firebase deploy --only hosting:api-genavatar
```

**Critical build quirk**: `build` runs `copyfiles src/_lib/_img/**/* lib/_lib/_img -u 3` after `tsc`. The image assets in `src/_lib/_img/` must be copied to `lib/_lib/_img/` or the function will fail at runtime — `tsc` alone is not enough.

**pnpm node-linker**: `functions/.npmrc` sets `node-linker=hoisted` so `node_modules` has a flat layout compatible with the Firebase CLI bundler. Do not remove this.

**pnpm build scripts**: `sharp`, `protobufjs`, and `re2` are listed in `pnpm.onlyBuiltDependencies` in `package.json`. If adding a new dep that needs a postinstall script, add it there too — pnpm blocks unlisted build scripts by default.

## Local dev

```bash
# From functions/
pnpm run serve   # tsc --watch + firebase emulators:start (via concurrently)
```

Requires Firebase CLI and a project-linked environment (`firebase use`).

## TypeScript config

`strict: true`, `noUnusedLocals: true`, `noImplicitReturns: true`. Unused imports/variables are compile errors, not just warnings.

Node version pin: `functions/.nvmrc` → `22`.

## CI / deployment

Two separate workflows, both trigger on push to `main`:

- `firebase-deploy.yml` — deploys functions when `functions/**` or `firebase.json` changes; uses `pnpm/action-setup` + `FIREBASE_TOKEN` secret.
- `firebase-hosting.yml` — deploys hosting when `public/**` or `firebase.json` changes; uses `FIREBASE_SERVICE_ACCOUNT_AVATARS_333CB` secret.

No test step in CI. No linting step in CI.

## Key dependency

`avatars-utils` (npm) provides `filePaths`, `Hash`, `hashFactory`, `sumAndDiff` — the deterministic hashing that makes the same ID always produce the same avatar. If avatar output changes unexpectedly, check this package version.

## No tests

There are no test files.
