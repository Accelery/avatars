import { randomUUID } from "crypto";
import { onRequest } from "firebase-functions/v2/https";
import { combine, defaultFaceFactory } from "./_lib";

export const id = onRequest(async (req, res) => {
  const id = req.path?.slice(1) || randomUUID();
  const face = defaultFaceFactory.create(id);
  const png = await combine(face).png().toBuffer();
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});

export const favicon = onRequest(async (req, res) => {
  const id = req.headers.referer?.slice(1) || randomUUID();
  const face = defaultFaceFactory.create(id);
  const png = await combine(face).png().toBuffer();
  res.setHeader("Content-Type", "image/png");
  res.send(png);
});
