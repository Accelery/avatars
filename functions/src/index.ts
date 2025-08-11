import { randomUUID } from "crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { combine, createFace } from "./_lib";

initializeApp();
const firestoreService = getFirestore();

// Helper function to log request analytics
async function logRequestAnalytics(
  id: string,
  type: "random" | "custom",
  referer?: string
) {
  try {
    const docId = `${type}:${id}`;
    const docRef = firestoreService.collection("analytics").doc(docId);

    await docRef.set(
      {
        id,
        type,
        lastAccess: new Date(),
        count: FieldValue.increment(1),
        referers: FieldValue.arrayUnion(referer),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error logging analytics:", error);
    // Don't throw error - we don't want to fail the request if analytics fails
  }
}

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

  // Log analytics after sending response
  await logRequestAnalytics(
    id,
    pathId ? "custom" : "random",
    req.headers["referer"]
  );
});
