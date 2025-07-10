# avatars

Deployed on Firebase Functions, this project generates unique avatar images
based on a random ID or a specified ID in the URL path. The avatars are composed
of eyes, nose, and mouth images, combined with a background color.

## Usage

To generate an avatar, you can use the following URL format:

```
https://genavatar.me/<id>
```

Replace `<id>` with a random string or a specific identifier. If no ID is provided,
a random ID will be generated.

### Example:

```
https://genavatar.me/
```

<img src="https://genavatar.me/" alt="drawing" width="200"/>

_(Random Avatar at every refresh)_

```
https://genavatar.me/random
```

<img src="https://genavatar.me/random" alt="drawing" width="200"/>

## Features

- Generates unique avatars based on a random or specified ID.
- Combines different facial features (eyes, nose, mouth) with a background color.
