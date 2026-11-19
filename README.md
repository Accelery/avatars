# genavatar.me

Deterministic avatars from any string, served as a plain image URL.

```
https://api.genavatar.me/<your-id>
```

Pass any string as the path and get back a PNG. The same ID always produces the same avatar. Omit the path for a random one.

## Usage

```html
<!-- Named: consistent across requests -->
<img src="https://api.genavatar.me/username">

<!-- Random: new avatar on every request -->
<img src="https://api.genavatar.me/">
```

No API key. No SDK. No sign-up.

Add `?size=128` for a smaller square PNG. Sizes from 16 to 400 pixels are supported. The default is 400, and invalid values fall back to 400.

Add `?notrack=true` to skip usage analytics for a request.

Full documentation: https://genavatar.me/docs/

## How it works

Each avatar is composed of eyes, a nose, a mouth, and a background color. The combination is derived deterministically from the input string, so the same ID always maps to the same face.

Named avatars are cached in the browser for one year (`Cache-Control: public, max-age=31536000, immutable`). Random avatars are never cached by the browser. The Worker caches rendered faces internally so identical faces are not generated twice in the same edge location.

The landing page includes a light/dark theme toggle. It follows the system preference by default and saves the user's choice in `localStorage`.

## Repository layout

```
public/        # Static site: landing, docs, guides, privacy
  docs/        # API documentation
  guides/      # HTML, React, Next.js examples
  theme.js     # Light/dark theme toggle
  openapi.json # Machine-readable API spec
  llms.txt     # API summary for AI tools
worker/        # Avatar API (api.genavatar.me): TypeScript, Cloudflare Workers
  src/
    index.ts         # Fetch handler, caching, analytics
    _lib/
      index.ts       # createFace() and combine() via @cf-wasm/photon
      blocked.ts     # Scanner path blocklist
      _img/          # PNG assets: eyes/ nose/ mouth/
  wrangler.jsonc     # Wrangler config
```

## Development

```bash
cd worker
pnpm install
pnpm run dev      # Wrangler dev server
pnpm run typecheck
```

## Deployment

Changes deploy automatically on push to `main`:

- `worker/**` changes deploy the Cloudflare Worker through GitHub Actions
- `public/**` changes deploy the landing page through Cloudflare Pages

To deploy the worker manually:

```bash
cd worker
pnpm run deploy
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
