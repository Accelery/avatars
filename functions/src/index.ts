import { randomUUID } from "crypto";
import { onRequest } from "firebase-functions/v2/https";
import { combine, createFace } from "./_lib";

export const id = onRequest({ timeoutSeconds: 5 }, async (req, res) => {
  const pathId = req.path?.slice(1);
  const id = pathId || randomUUID();
  const face = createFace(id);
  const png = await combine(face).png().toBuffer();
  res.setHeader("Content-Type", "image/png");
  res.setHeader("X-Genavatar-ID", id);

  if (pathId) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Expires", new Date(Date.now() + 31536000000).toUTCString());
  } else {
    // Set no cache headers for random faces
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0"
    );
    res.setHeader("Expires", "0");
  }

  res.send(png);
});
