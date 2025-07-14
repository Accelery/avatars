import { randomUUID } from "crypto";
import { onRequest } from "firebase-functions/v2/https";
import { combine, defaultFaceFactory } from "./_lib";

export const id = onRequest({ timeoutSeconds: 5 }, async (req, res) => {
  const pathId = req.path?.slice(1);
  const id = pathId || randomUUID();
  const face = defaultFaceFactory.create(id);
  const png = await combine(face).png().toBuffer();
  res.setHeader("Content-Type", "image/png");
  if (pathId) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  res.send(png);
});

export const favicon = onRequest({ timeoutSeconds: 5 }, async (req, res) => {
  const referer = req.headers.referer;
  const id = referer || randomUUID();
  const face = defaultFaceFactory.create(id);
  const png = await combine(face).png().toBuffer();
  res.setHeader("Content-Type", "image/png");
  if (referer) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  res.send(png);
});
