# AGENTS.md

## Repo overview

Static landing page (`public/`) + a Cloudflare Worker (`worker/`) that generates PNG avatars on demand. No monorepo tooling; the two parts are independent and deployed separately.

## Directory layout

```
public/          # Landing page (genavatar.me) - plain HTML/CSS, no build step
worker/          # Cloudflare Worker source (TypeScript, workerd runtime)
  src/
    index.ts     # Worker entry point: fetch handler
    _lib/
      index.ts   # createFace() + combine() using @cf-wasm/photon
      _img/      # PNG asset files for eyes/, nose/, mouth/
  dist/          # Compiled output - NOT committed, produced by wrangler
  wrangler.jsonc # Wrangler config - domain, Analytics Engine binding, asset rules
```

## Working in `worker/`

**Package manager: pnpm.** Do not use `npm` - there is no `package-lock.json`. All commands must be run from the `worker/` directory.

```bash
# Install
pnpm install

# Local dev (wrangler dev server)
pnpm run dev

# Deploy to Cloudflare Workers
pnpm run deploy
```

**Asset loading**: PNG images are statically imported as `ArrayBuffer` via Wrangler's `Data` module rule (`wrangler.jsonc` line 7). There is no filesystem access at runtime - assets are bundled into the Worker at deploy time. Do not switch to `fs` or path-based loading.

**Image library**: `@cf-wasm/photon` (the `workerd`-compatible WASM build). `sharp` is explicitly blocked in `pnpm.ignoredBuiltDependencies` and must not be used - it is a Node.js native addon and will not run in the Workers runtime.

**pnpm build scripts**: `esbuild` and `workerd` are listed in `pnpm.onlyBuiltDependencies`. If adding a new dep that needs a postinstall script, add it there too — pnpm blocks unlisted build scripts by default.

## TypeScript config

`strict: true`. The Worker runtime provides its own globals; do not add `@types/node`.

Node version pin: `worker/package.json` `engines.node` → `22` (used for the build toolchain only, not the runtime).

## Analytics

Each request writes one append-only data point to Cloudflare Analytics Engine (binding: `ANALYTICS_ENGINE`, dataset: `analytics_avatars`). Fields written:

- `indexes[0]`: the URL path ID, or `"random"` for path-less requests
- `blobs[0]`: `Referer` header value, or `""` if absent
- `blobs[1]`: the avatar ID used for rendering (UUID for random requests)

The write is skipped when `?notrack=true` is present in the request.

## CI / deployment

Two separate workflows, both trigger on push to `main`:

- `worker-deploy.yml` - deploys the worker when `worker/**` changes; uses `CLOUDFLARE_API_TOKEN` secret.
- `firebase-hosting.yml` - deploys the landing page when `public/**` or `firebase.json` changes; uses `FIREBASE_SERVICE_ACCOUNT_AVATARS_333CB` secret.

No test step in CI. No linting step in CI.

## Key dependency

The hashing logic (`charCodes`, `sumReduce`, `sumDiffReduce`, `pick`) is inlined in `worker/src/_lib/index.ts` and mirrors the `avatars-utils` npm package. The same ID always produces the same avatar because of this. If avatar output changes unexpectedly, check this logic first.

## Writing style

When writing copy for this project (privacy page, landing page, README, etc.):

- No em dashes. Use a regular hyphen or rewrite the sentence.
- No filler phrases like "of any kind", "it is worth noting", "this ensures that".
- No AI list padding - if something can be said in one sentence, do not make it a bullet list.
- Keep sentences short and direct.
