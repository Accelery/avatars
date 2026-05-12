import { PhotonImage, watermark } from "@cf-wasm/photon/workerd";

// ── Asset imports (ArrayBuffer via Wrangler Data rule) ────────────────────────
// Order matches Node fs.readdirSync lexicographic output to preserve pick() parity.

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
  color: string;
  eyes: ArrayBuffer;
  nose: ArrayBuffer;
  mouth: ArrayBuffer;
}

// ── Hashing ───────────────────────────────────────────────────────────────────

const charCodes = (s: string): number[] =>
  s.split("").map((c) => c.charCodeAt(0) || 0);

const sumReduce = (a: number[]): number => a.reduce((acc, n) => acc + n, 0);
const sumDiffReduce = (a: number[]): number =>
  a.reduce((acc, n, i) => (i % 2 === 0 ? acc + n : acc - n), 0);

/** Pick an item from `values` deterministically based on `key`. */
const pick =
  <T>(values: T[], reducer: (a: number[]) => number) =>
  (key: string): T => {
    const codes = charCodes(key);
    return values[Math.abs((reducer(codes) + codes.length) % values.length)];
  };

// ── Assets ────────────────────────────────────────────────────────────────────

const colors = [
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

const eyeAssets: ArrayBuffer[] = [
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
const noseAssets: ArrayBuffer[] = [
  nose2,
  nose3,
  nose4,
  nose5,
  nose6,
  nose7,
  nose8,
  nose9,
];
const mouthAssets: ArrayBuffer[] = [
  mouth1,
  mouth10,
  mouth11,
  mouth3,
  mouth5,
  mouth6,
  mouth7,
  mouth9,
];

const pickColor = pick(colors, sumReduce);
const pickEyes = pick(eyeAssets, sumReduce);
const pickNose = pick(noseAssets, sumReduce);
const pickMouth = pick(mouthAssets, sumDiffReduce);

// ── Public API ────────────────────────────────────────────────────────────────

export const createFace = (id: string): Face => ({
  color: pickColor(id),
  eyes: pickEyes(id),
  nose: pickNose(id),
  mouth: pickMouth(id),
});

/** Parse a CSS hex color string like "#81bef1" into [r, g, b] bytes. */
const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};

const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 400;

/**
 * Composite eyes + mouth + nose onto a solid background and return PNG bytes.
 * All PhotonImage instances are explicitly freed to avoid WASM memory leaks.
 */
export const combine = (face: Face): Uint8Array => {
  const [r, g, b] = hexToRgb(face.color);

  // Build solid-color background (RGBA, fully opaque)
  const bgPixels = new Uint8Array(IMAGE_WIDTH * IMAGE_HEIGHT * 4);
  for (let i = 0; i < bgPixels.length; i += 4) {
    bgPixels[i] = r;
    bgPixels[i + 1] = g;
    bgPixels[i + 2] = b;
    bgPixels[i + 3] = 255;
  }

  const bg = new PhotonImage(bgPixels, IMAGE_WIDTH, IMAGE_HEIGHT);
  const eyes = PhotonImage.new_from_byteslice(new Uint8Array(face.eyes));
  const mouth = PhotonImage.new_from_byteslice(new Uint8Array(face.mouth));
  const nose = PhotonImage.new_from_byteslice(new Uint8Array(face.nose));

  // watermark() alpha-composites overlay onto base in-place at (x=0, y=0)
  // x/y are u32 in the WASM ABI, which wasm-bindgen exposes as bigint
  watermark(bg, eyes, BigInt(0), BigInt(0));
  watermark(bg, mouth, BigInt(0), BigInt(0));
  watermark(bg, nose, BigInt(0), BigInt(0));

  const png = bg.get_bytes();

  bg.free();
  eyes.free();
  mouth.free();
  nose.free();

  return png;
};
