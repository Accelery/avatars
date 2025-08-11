import { randomUUID } from "crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { combine, createFace } from "./_lib";

initializeApp();
const firestoreService = getFirestore();

export const id = onRequest({ timeoutSeconds: 1 }, async (req, res) => {
  const pathId = req.path?.slice(1);
  const id = pathId || randomUUID();
  const face = createFace(id);
  const png = await combine(face).png().toBuffer();
  res.setHeader("Content-Type", "image/png");
  res.setHeader("X-Genavatar-ID", id);
  res.setHeader(
    "Cache-Control",
    pathId
      ? "public, max-age=31536000, immutable"
      : "no-store, no-cache, must-revalidate, max-age=0"
  );

  res.send(png);
  const type = pathId ? "custom" : "random";
  firestoreService
    .collection("analytics")
    .doc(type === "random" ? `${type}` : `${type}:${id}`)
    .set(
      {
        id,
        type,
        lastAccess: new Date(),
        count: FieldValue.increment(1),
        referers: FieldValue.arrayUnion(req.headers["referer"] || ""),
      },
      { merge: true }
    );
});
