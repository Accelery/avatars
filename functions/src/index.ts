import { randomUUID } from "crypto";
import { initializeApp } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { combine, createFace } from "./_lib";

initializeApp();
const firestoreService = getFirestore();

// Helper function to log request analytics
async function logRequestAnalytics(
  type: "random" | "custom",
  metadata: {
    id: string;
    userAgent?: string;
    referer?: string;
    ip?: string;
  }
) {
  try {
    await firestoreService.collection("analytics").add({
      timestamp: new Date(),
      type,
      ...metadata,
    });
  } catch (error) {
    console.error("Error logging analytics:", error);
    // Don't throw error - we don't want to fail the request if analytics fails
  }
}

export const id = onRequest({ timeoutSeconds: 5 }, async (req, res) => {
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
  await logRequestAnalytics(pathId ? "custom" : "random", {
    id,
    userAgent: req.headers["user-agent"],
    referer: req.headers["referer"],
    ip: req.ip,
  });
});
