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
  } else {
    // Set no cache headers for random faces
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  // Add X-Genavatar-ID header for caching purposes
  res.setHeader("X-Genavatar-ID", id);
  res.send(png);
});
