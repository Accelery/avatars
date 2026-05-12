import fs from "fs";
import path from "path";
import sharp from "sharp";

export interface Face {
  color: string;
  eyes: string;
  nose: string;
  mouth: string;
}

// ── Hashing ───────────────────────────────────────────────────────────────────

const charCodes = (s: string): number[] => s.split("").map((c) => c.charCodeAt(0) || 0);

const sumReduce    = (a: number[]): number => a.reduce((acc, n) => acc + n, 0);
const sumDiffReduce = (a: number[]): number => a.reduce((acc, n, i) => i % 2 === 0 ? acc + n : acc - n, 0);

/** Pick an item from `values` deterministically based on `key`. */
const pick = <T>(values: T[], reducer: (a: number[]) => number) =>
  (key: string): T => {
    const codes = charCodes(key);
    return values[Math.abs((reducer(codes) + codes.length) % values.length)];
  };

// ── Assets ────────────────────────────────────────────────────────────────────

const imageDir = path.join(__dirname, "_img");

const imagesIn = (subdir: string): string[] =>
  fs.readdirSync(path.join(imageDir, subdir)).map((f) => path.join(imageDir, subdir, f));

const colors = ["#81bef1", "#ad8bf2", "#bff288", "#de7878", "#a5aac5", "#6ff2c5", "#f0da5e", "#eb5972", "#f6be5d"];

const pickColor  = pick(colors,          sumReduce);
const pickEyes   = pick(imagesIn("eyes"),  sumReduce);
const pickNose   = pick(imagesIn("nose"),  sumReduce);
const pickMouth  = pick(imagesIn("mouth"), sumDiffReduce);

// ── Public API ────────────────────────────────────────────────────────────────

export const createFace = (id: string): Face => ({
  color: pickColor(id),
  eyes:  pickEyes(id),
  nose:  pickNose(id),
  mouth: pickMouth(id),
});

export const combine = (face: Face) =>
  sharp(face.eyes)
    .composite([{ input: face.mouth }, { input: face.nose }])
    .flatten({ background: face.color });
