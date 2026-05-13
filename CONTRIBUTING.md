# Contributing

## Prerequisites

- [Node.js 22](https://nodejs.org/) (use [nvm](https://github.com/nvm-sh/nvm): `nvm use` inside `worker/`)
- [pnpm](https://pnpm.io/installation)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): installed automatically as a dev dependency

## Local setup

```bash
git clone https://github.com/Accelery/avatars.git
cd avatars/worker
pnpm install
```

## Running locally

```bash
cd worker
pnpm run dev
```

This starts a local Wrangler dev server. The worker is available at `http://localhost:8787/<your-id>`.

No Cloudflare account is needed for local dev — Wrangler runs the worker entirely on your machine.

## Building

Wrangler compiles and bundles the TypeScript source automatically on `dev` and `deploy`. There is no separate build step.

## Changing or adding avatar assets

The image assets in `worker/src/_lib/_img/` are the building blocks of every avatar. A few rules:

- **Do not fill numbering gaps.** The existing filenames have gaps (e.g. `eyes8.png` is missing). The hash selects assets by array index, not filename. Inserting a file where a gap exists shifts every subsequent index and silently changes the avatar produced for every existing ID, breaking the determinism guarantee.
- **Append new assets only.** Adding a file at the end of the sorted list is safe — existing IDs are unaffected.
- **Match dimensions.** All assets are 400×400 PNG. New assets must be the same size.
- If you change anything that affects which avatar is produced for an existing ID, that is a **breaking change** and needs to be called out explicitly.

## CI / deployment secrets

| Secret | Used by |
|---|---|
| `CLOUDFLARE_API_TOKEN` | `worker-deploy.yml` — deploys the worker |
| `FIREBASE_SERVICE_ACCOUNT_AVATARS_333CB` | `firebase-hosting.yml` — deploys the landing page |

## Pull requests

- TypeScript must compile cleanly (Wrangler will error on type issues during `dev`/`deploy`)
- Keep PRs focused — one concern per PR
- Describe *what* changed and *why* in the PR body

## Project structure

```
public/          # Landing page — plain HTML/CSS, no build step
worker/          # Cloudflare Worker — TypeScript, workerd runtime
  src/
    index.ts           # Fetch handler
    _lib/
      index.ts         # createFace() + combine()
      _img/            # PNG assets: eyes/ nose/ mouth/
  wrangler.jsonc       # Wrangler config
.github/
  workflows/
    worker-deploy.yml    # Deploys worker on push to main
    firebase-hosting.yml # Deploys landing page on push to main
```
