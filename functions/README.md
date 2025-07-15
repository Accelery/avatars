# Avatar Generator Firebase Functions

This directory contains the Firebase Functions that power the genavatar.me avatar generation service. These functions generate unique avatar images based on a specified ID or randomly.

## Functions Overview

Two main functions are exposed:

1. **id** - Generates an avatar based on a specific ID provided in the URL path
   - Route: `https://genavatar.me/<your-id>`
   - Example: `https://genavatar.me/user123`

2. **random** - Generates a random avatar each time it's called
   - Route: `https://genavatar.me/random`

## How It Works

Each avatar is composed of:
- A randomly selected pair of eyes
- A randomly selected nose
- A randomly selected mouth
- A background color

For the `id` function, the components are selected deterministically based on the provided ID, ensuring the same ID always produces the same avatar.

## Local Development

To run the functions locally:

```bash
npm run serve
```

This will start the Firebase emulator and watch for file changes.

## Deployment

Deploy to Firebase Functions using:

```bash
npm run deploy
```

Or via the GitHub Actions workflow which automatically deploys on push to the main branch.

## Project Structure

```
functions/
├── src/              # TypeScript source files
│   ├── index.ts      # Main entry point
│   └── _lib/         # Supporting library code
│       ├── index.ts  # Library exports
│       └── _img/     # Image assets (eyes, nose, mouth)
├── lib/              # Compiled JavaScript output
├── node_modules/     # Dependencies
├── package.json      # Project configuration
└── tsconfig.json     # TypeScript configuration
```

## Caching

The generated avatars use aggressive caching with:
- `public` - Cacheable by any cache
- `max-age=31536000` - Cache for one year
- `immutable` - Content will never change during freshness lifetime

This ensures fast loading times and reduced bandwidth usage for returning visitors.
