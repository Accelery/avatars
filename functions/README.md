# functions/

Avatar generation for [genavatar.me](https://genavatar.me). A single Cloud Function receives an HTTP request, composites a PNG from static assets, and returns it.

## Commands

All commands run from this directory.

```bash
pnpm install                  # install dependencies
pnpm run build                # compile TypeScript + copy image assets to lib/
pnpm run serve                # watch mode + Firebase emulator
pnpm run deploy               # deploy to Cloud Functions
```

> **Note:** `pnpm run build` does two things: runs `tsc` and copies `src/_lib/_img/` into `lib/_lib/_img/`. The copy step is required — `tsc` alone leaves the function without its assets at runtime.

## Source

| File | Purpose |
|---|---|
| `src/index.ts` | HTTP handler — parses the request path, calls `createFace`, returns PNG |
| `src/_lib/index.ts` | `createFace(id)` + `combine(face)` — hashing and sharp pipeline |
| `src/_lib/_img/` | Static PNG assets: `eyes/` (9), `nose/` (8), `mouth/` (8) |

## How the pipeline works

1. The request path (up to 36 chars) is used as the avatar ID. An empty path generates a random UUID.
2. `createFace(id)` hashes the ID to select one asset from each category and a background color.
3. `combine(face)` composites the three layers with sharp and flattens them onto the background color.
4. The result is returned as `image/png`.

Named IDs get `Cache-Control: public, max-age=31536000, immutable`. Random requests get `no-store`.

## Asset ordering

The image files in `_img/` have non-contiguous numbering (some numbers are missing). **Do not fill the gaps.** The hash selects by array index — adding a file where a gap exists changes the index of every subsequent file and breaks determinism for all existing IDs. Append new assets only.
