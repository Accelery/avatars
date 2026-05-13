# genavatar.me

Unique, deterministic avatars from any string — served as a plain HTTP image URL.

```
https://api.genavatar.me/<your-id>
```

Pass any string as the path and get back a PNG. Same ID always produces the same avatar. Omit the path for a random one.

## Usage

```html
<!-- Named — consistent across requests -->
<img src="https://api.genavatar.me/username">

<!-- Random — new avatar on every request -->
<img src="https://api.genavatar.me/">
```

No API key. No SDK. No sign-up.

## How it works

Each avatar is composed of eyes, a nose, a mouth, and a background color. The combination is derived deterministically from the input string via a stable hash, so the same ID always maps to the same face.

Named avatars are cached for one year (`Cache-Control: public, max-age=31536000, immutable`). Random avatars are never cached.

## Repository layout

```
public/        # Landing page — static HTML/CSS, no build step
worker/        # Avatar generation — TypeScript, Cloudflare Workers
  src/
    index.ts         # Fetch handler
    _lib/
      index.ts       # createFace() + combine() via @cf-wasm/photon
      _img/          # PNG assets: eyes/ nose/ mouth/
  wrangler.jsonc     # Wrangler config
```

## Development

```bash
cd worker
pnpm install
pnpm run dev      # wrangler dev server
```

## Deployment

CI deploys automatically on push to `main`:

- `worker/**` changes → deploys the Cloudflare Worker
- `public/**` changes → deploys the landing page

To deploy manually:

```bash
cd worker
pnpm run deploy
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
