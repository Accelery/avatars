# Contributing

## Prerequisites

- [Node.js 22](https://nodejs.org/) (use [nvm](https://github.com/nvm-sh/nvm): `nvm use` inside `functions/`)
- [pnpm](https://pnpm.io/installation)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`

## Local setup

```bash
git clone https://github.com/Accelery/avatars.git
cd avatars

# Configure Firebase (see "Running locally" below)
cp .firebaserc.example .firebaserc

# Install dependencies
cd functions
pnpm install
```

## Running locally

You do not need access to the live Firebase project. The emulator runs the function entirely on your machine.

```bash
cd functions
pnpm run serve
```

This starts `tsc --watch` and the Firebase Functions emulator in parallel. The function is available at:

```
http://localhost:5001/<project-id>/us-central1/id/<your-id>
```

The project ID in the URL comes from `.firebaserc`. For local dev it can be any string — set it to a placeholder if you don't have a real project:

```bash
firebase use --add   # follow the prompt, or just edit .firebaserc manually
```

To avoid Firestore write errors during local dev, set the emulator host before starting:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
pnpm run serve
```

Or start all emulators (Functions + Firestore together):

```bash
firebase emulators:start
```

## Tests

```bash
cd functions
pnpm test
```

Tests run against the source assets directly — no build step needed. They must pass before any PR is merged, and they run automatically in CI before every deploy.

## Building

```bash
cd functions
pnpm run build
```

This does two things: compiles TypeScript with `tsc`, then copies `src/_lib/_img/` into `lib/_lib/_img/`. Both steps are required — `tsc` alone leaves the function without its image assets at runtime.

## Changing or adding avatar assets

The image assets in `functions/src/_lib/_img/` are the building blocks of every avatar. A few rules:

- **Do not fill numbering gaps.** The existing filenames have gaps (e.g. `eyes8.png` is missing). The hash selects assets by array index, not filename. Inserting a file where a gap exists shifts every subsequent index and silently changes the avatar produced for every existing ID, breaking the determinism guarantee.
- **Append new assets only.** Adding a file at the end of the sorted list is safe — existing IDs are unaffected.
- **Match dimensions.** All assets are 400×400 PNG. New assets must be the same size.
- If you change anything that affects which avatar is produced for an existing ID, that is a **breaking change** and needs to be called out explicitly.

## CI / deployment secrets

The functions deploy workflow authenticates to Google Cloud using a service account JSON key stored as a repository secret.

| Secret | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_AVATARS_333CB` | Full contents of the service account JSON key file |

To set up from scratch (requires `gcloud` and `Owner` on the project):

```bash
PROJECT_ID=your-project-id

# 1. Create the service account and grant Firebase deploy permissions
gcloud iam service-accounts create "github-actions" \
  --project=$PROJECT_ID \
  --display-name="GitHub Actions deploy"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# 2. Create and download a JSON key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
```

Then add the secret in GitHub:

```bash
# Set FIREBASE_SERVICE_ACCOUNT_AVATARS_333CB to the full contents of github-actions-key.json
gh secret set FIREBASE_SERVICE_ACCOUNT_AVATARS_333CB < github-actions-key.json

# Remove the local key file
rm github-actions-key.json
```

## Pull requests

- TypeScript must compile cleanly (`pnpm run build`)
- All tests must pass (`pnpm test`)
- Keep PRs focused — one concern per PR
- Describe *what* changed and *why* in the PR body

## Project structure

```
public/          # Landing page — plain HTML/CSS, no build step
functions/       # Cloud Function — TypeScript, Node 22
  src/
    index.ts           # HTTP handler
    _lib/
      index.ts         # createFace() + combine()
      index.test.ts    # Unit tests
      _img/            # PNG assets: eyes/ nose/ mouth/
.github/
  workflows/
    firebase-deploy.yml   # Deploys function on push to main
    firebase-hosting.yml  # Deploys landing page on push to main
```
