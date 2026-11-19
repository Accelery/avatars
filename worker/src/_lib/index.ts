import {
  PhotonImage,
  SamplingFilter,
  resize,
  watermark,
} from "@cf-wasm/photon/workerd";

// ── Asset imports (ArrayBuffer via Wrangler Data rule) ────────────────────────
// Array order is part of each avatar's identity. Append assets; never reorder.

import eyes1 from "./_img/eyes/eyes1.png";
import eyes10 from "./_img/eyes/eyes10.png";
import eyes2 from "./_img/eyes/eyes2.png";
import eyes3 from "./_img/eyes/eyes3.png";
import eyes4 from "./_img/eyes/eyes4.png";
import eyes5 from "./_img/eyes/eyes5.png";
import eyes6 from "./_img/eyes/eyes6.png";
import eyes7 from "./_img/eyes/eyes7.png";
import eyes9 from "./_img/eyes/eyes9.png";

import nose2 from "./_img/nose/nose2.png";
import nose3 from "./_img/nose/nose3.png";
import nose4 from "./_img/nose/nose4.png";
import nose5 from "./_img/nose/nose5.png";
import nose6 from "./_img/nose/nose6.png";
import nose7 from "./_img/nose/nose7.png";
import nose8 from "./_img/nose/nose8.png";
import nose9 from "./_img/nose/nose9.png";

import mouth1 from "./_img/mouth/mouth1.png";
import mouth10 from "./_img/mouth/mouth10.png";
import mouth11 from "./_img/mouth/mouth11.png";
import mouth3 from "./_img/mouth/mouth3.png";
import mouth5 from "./_img/mouth/mouth5.png";
import mouth6 from "./_img/mouth/mouth6.png";
import mouth7 from "./_img/mouth/mouth7.png";
import mouth9 from "./_img/mouth/mouth9.png";

export interface Face {
  readonly key: string;
  readonly color: string;
  readonly eyes: ArrayBuffer;
  readonly nose: ArrayBuffer;
  readonly mouth: ArrayBuffer;
}

// ── Hashing ───────────────────────────────────────────────────────────────────

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const textEncoder = new TextEncoder();

/**
 * Compute a 32-bit unsigned FNV-1a hash with a Murmur3 finalizer over UTF-8 bytes.
 * Domain-salted so each facial feature is hashed independently.
 */
const hashWithSalt = (salt: string, input: string): number => {
  let hash = FNV_OFFSET_BASIS;
  const bytes = textEncoder.encode(`${salt}\0${input}`);
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, FNV_PRIME);
  }

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  return hash >>> 0;
};

/** Pick an array index deterministically based on `salt` and `key`. */
const pickIndex = (length: number, salt: string, key: string): number =>
  hashWithSalt(salt, key) % length;

// ── Assets ────────────────────────────────────────────────────────────────────

const colors: readonly string[] = [
  "#81bef1",
  "#ad8bf2",
  "#bff288",
  "#de7878",
  "#a5aac5",
  "#6ff2c5",
  "#f0da5e",
  "#eb5972",
  "#f6be5d",
];

const eyeAssets: readonly ArrayBuffer[] = [
  eyes1,
  eyes10,
  eyes2,
  eyes3,
  eyes4,
  eyes5,
  eyes6,
  eyes7,
  eyes9,
];
const noseAssets: readonly ArrayBuffer[] = [
  nose2,
  nose3,
  nose4,
  nose5,
  nose6,
  nose7,
  nose8,
  nose9,
];
const mouthAssets: readonly ArrayBuffer[] = [
  mouth1,
  mouth10,
  mouth11,
  mouth3,
  mouth5,
  mouth6,
  mouth7,
  mouth9,
];

// ── Public API ────────────────────────────────────────────────────────────────

export const createFace = (id: string): Face => {
  const colorIdx = pickIndex(colors.length, "color", id);
  const eyesIdx = pickIndex(eyeAssets.length, "eyes", id);
  const noseIdx = pickIndex(noseAssets.length, "nose", id);
  const mouthIdx = pickIndex(mouthAssets.length, "mouth", id);

  return {
    key: `c${colorIdx}-e${eyesIdx}-n${noseIdx}-m${mouthIdx}`,
    color: colors[colorIdx],
    eyes: eyeAssets[eyesIdx],
    nose: noseAssets[noseIdx],
    mouth: mouthAssets[mouthIdx],
  };
};

/** Parse a CSS hex color string like "#81bef1" into [r, g, b] bytes. */
const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};

export const MAX_AVATAR_SIZE = 400;
const IMAGE_WIDTH = MAX_AVATAR_SIZE;
const IMAGE_HEIGHT = MAX_AVATAR_SIZE;

/**
 * Composite eyes + mouth + nose onto a solid background and return PNG bytes.
 * All PhotonImage instances are explicitly freed to avoid WASM memory leaks.
 */
export const combine = (face: Face, size: number): Uint8Array => {
  const [r, g, b] = hexToRgb(face.color);

  // Pack one RGBA pixel using native endianness, then fill the background.
  const pixel = new Uint32Array(Uint8Array.of(r, g, b, 255).buffer)[0];
  const bgPixels = new Uint32Array(IMAGE_WIDTH * IMAGE_HEIGHT).fill(pixel);
  const bg = new PhotonImage(
    new Uint8Array(bgPixels.buffer),
    IMAGE_WIDTH,
    IMAGE_HEIGHT,
  );
  let eyes: PhotonImage | undefined;
  let mouth: PhotonImage | undefined;
  let nose: PhotonImage | undefined;

  try {
    eyes = PhotonImage.new_from_byteslice(new Uint8Array(face.eyes));
    mouth = PhotonImage.new_from_byteslice(new Uint8Array(face.mouth));
    nose = PhotonImage.new_from_byteslice(new Uint8Array(face.nose));

    // watermark() alpha-composites overlay onto base in-place at (x=0, y=0)
    // x/y are u32 in the WASM ABI, which wasm-bindgen exposes as bigint
    watermark(bg, eyes, BigInt(0), BigInt(0));
    watermark(bg, mouth, BigInt(0), BigInt(0));
    watermark(bg, nose, BigInt(0), BigInt(0));

    if (size === IMAGE_WIDTH) {
      return bg.get_bytes();
    }

    const resized = resize(bg, size, size, SamplingFilter.Lanczos3);
    try {
      return resized.get_bytes();
    } finally {
      resized.free();
    }
  } finally {
    bg.free();
    eyes?.free();
    mouth?.free();
    nose?.free();
  }
};
