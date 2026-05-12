import { randomUUID } from "crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { combine, createFace } from "./_lib";

initializeApp();
const firestoreService = getFirestore();

export const id = onRequest(
  { timeoutSeconds: 5, maxInstances: 5 },
  async (req, res) => {
    // Remove leading /, limit to 36 chars (UUID length), null when path is empty
    const pathId = encodeURIComponent(req.path?.slice(1, 37)) || null;

    const avatarId = pathId ?? randomUUID();
    const face = createFace(avatarId);
    const png = await combine(face).png().toBuffer();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("X-Genavatar-Id", avatarId);
    res.setHeader(
      "Cache-Control",
      pathId
        ? "public, max-age=31536000, immutable"
        : "no-store, no-cache, must-revalidate, max-age=0"
    );

    // Log analytics data (fire-and-forget), unless caller opts out
    const noTrack = req.query["notrack"] === "true";
    if (!noTrack) {
      const referer = req.headers["referer"];
      firestoreService
        .collection("analytics")
        .doc(pathId || "random")
        .set(
          {
            pathId,
            lastAccess: FieldValue.serverTimestamp(),
            count: FieldValue.increment(1),
            ...(referer ? { referers: FieldValue.arrayUnion(referer) } : {}),
          },
          { merge: true }
        )
        .catch((err) => console.error("Analytics write failed:", err));
    }
    res.send(png);
  }
);
