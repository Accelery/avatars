# Contributing

## Prerequisites

- [Node.js 26 LTS](https://nodejs.org/) (use [nvm](https://github.com/nvm-sh/nvm): `nvm use` from the repository root)
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

No Cloudflare account is needed for local dev, because Wrangler runs the worker entirely on your machine.

To preview the landing page, serve `public/` with any static file server. There is no build step.

## Checks

Wrangler compiles and bundles the TypeScript source automatically on `dev` and `deploy`. Run the TypeScript check before opening a pull request:

```bash
cd worker
pnpm run typecheck
```

There is no automated test suite or linter.

## Changing or adding avatar assets

The image assets in `worker/src/_lib/_img/` are the building blocks of every avatar. The arrays in `worker/src/_lib/index.ts` define the selection order, not the filenames.

- **Do not reorder or insert into existing array positions.** That shifts later indexes and changes the avatar for existing IDs.
- **Append new assets.** Import the new file and add it to the end of the relevant array. Filename numbering gaps are historical and do not affect selection.
- **Match dimensions.** All assets are 400x400 PNGs. New assets must be the same size.
- Any change that affects which avatar an existing ID produces is a **breaking change** and must be called out in the pull request.

## CI / deployment secrets

| Secret | Used by |
|---|---|
| `CLOUDFLARE_API_TOKEN` | `worker-deploy.yml` - deploys the worker |

Cloudflare Pages deploys `public/` from this repository. It needs no GitHub Actions secret.

## Pull requests

- Run `pnpm run typecheck` inside `worker/` and keep it clean
- Keep PRs focused on one concern
- Describe what changed and why in the PR body

## Project structure

```
public/          # Landing page: static HTML, CSS, JS, no build step
  theme.js       # Light/dark theme toggle
worker/          # Avatar API: TypeScript, workerd runtime
  src/
    index.ts           # Fetch handler, caching, analytics
    _lib/
      index.ts         # createFace() and combine()
      blocked.ts       # Scanner path blocklist
      _img/            # PNG assets: eyes/ nose/ mouth/
  wrangler.jsonc       # Wrangler config
.github/
  workflows/
    worker-deploy.yml  # Deploys worker on push to main
```
