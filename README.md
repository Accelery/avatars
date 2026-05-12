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
functions/     # Avatar generation — TypeScript, Node 22
  src/
    index.ts         # HTTP handler (exported as `id`)
    _lib/
      index.ts       # createFace() + combine() via sharp
      _img/          # PNG assets: eyes/ nose/ mouth/
```

## Development

```bash
cp .firebaserc.example .firebaserc   # configure your Firebase project (or any placeholder)
cd functions
pnpm install
pnpm test                            # run unit tests
pnpm run serve                       # tsc --watch + Firebase emulator
```

Requires the [Firebase CLI](https://firebase.google.com/docs/cli). See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions including emulator-only dev (no real Firebase project needed).

## Deployment

CI deploys automatically on push to `main`:

- `functions/**` changes → deploys the Cloud Function
- `public/**` changes → deploys the landing page

To deploy manually:

```bash
cd functions
pnpm run deploy           # function only
firebase deploy --only hosting:landing
firebase deploy --only hosting:api-genavatar
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
