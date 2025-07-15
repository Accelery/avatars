import { filePaths, Hash, hashFactory, sumAndDiff } from "avatars-utils";
import path from "path";
import sharp from "sharp";

interface Face {
  color: string;
  eyes: string;
  nose: string;
  mouth: string;
}

const imageDir = path.join(__dirname, "_img");

const imageFilePaths = (type: keyof Face): string[] =>
  filePaths(path.join(imageDir, type));

const eyeImages = imageFilePaths("eyes");
const noseImages = imageFilePaths("nose");
const mouthImages = imageFilePaths("mouth");
const defaultColors = [
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

const colorHash: Hash<string> = new Hash(defaultColors);
const eyeHash: Hash<string> = new Hash(eyeImages);
const noseHash: Hash<string> = new Hash(noseImages);
const mouthHash: Hash<string> = new Hash(mouthImages, hashFactory(sumAndDiff));

export const createFace = (string: string): Face => {
  return {
    color: colorHash.get(string),
    eyes: eyeHash.get(string),
    nose: noseHash.get(string),
    mouth: mouthHash.get(string),
  };
};

export const combine = (face: Face) =>
  sharp(face.eyes)
    .composite([{ input: face.mouth }, { input: face.nose }])
    .flatten({ background: face.color });
