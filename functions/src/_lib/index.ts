import { filePaths, Hash, hashFactory, sumAndDiff } from "avatars-utils";
import path from "path";
import sharp from "sharp";

export const combine = (face: Face) =>
  sharp(face.eyes)
    .composite([{ input: face.mouth }, { input: face.nose }])
    .flatten({ background: face.color });

const imageDir = path.join(__dirname, "_img");

const imageFilePaths = (type: keyof Face): string[] =>
  filePaths(path.join(imageDir, type));

const eyeImages = imageFilePaths("eyes");
const noseImages = imageFilePaths("nose");
const mouthImages = imageFilePaths("mouth");

interface Face {
  color: string;
  eyes: string;
  nose: string;
  mouth: string;
}

class FaceFactory {
  private colorHash: Hash<string>;
  private eyeHash: Hash<string>;
  private noseHash: Hash<string>;
  private mouthHash: Hash<string>;

  constructor(
    colors: string[],
    eyes: string[],
    noses: string[],
    mouths: string[]
  ) {
    this.colorHash = new Hash(colors);
    this.eyeHash = new Hash(eyes);
    this.noseHash = new Hash(noses);
    this.mouthHash = new Hash(mouths, hashFactory(sumAndDiff));
  }

  public create(string: string): Face {
    return {
      color: this.colorHash.get(string),
      eyes: this.eyeHash.get(string),
      nose: this.noseHash.get(string),
      mouth: this.mouthHash.get(string),
    };
  }
}

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

export const defaultFaceFactory = new FaceFactory(
  defaultColors,
  eyeImages,
  noseImages,
  mouthImages
);
