import { combine, createFace } from "./_lib";

export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Remove leading /, limit to 36 chars (UUID length), null when path is empty
    const rawPath = url.pathname.slice(1, 37);
    const pathId = rawPath ? encodeURIComponent(rawPath) : null;

    const avatarId = pathId ?? crypto.randomUUID();
    const face = createFace(avatarId);
    const png = combine(face);

    // Fire-and-forget analytics (unless caller opts out)
    const noTrack = url.searchParams.get("notrack") === "true";
    if (!noTrack) {
      env.ANALYTICS.writeDataPoint({
        blobs: [pathId ?? "random", request.headers.get("referer") ?? ""],
        doubles: [1],
        indexes: [avatarId],
      });
    }

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "X-Genavatar-Id": avatarId,
        "Cache-Control": pathId
          ? "public, max-age=31536000, immutable"
          : "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  },
} satisfies ExportedHandler<Env>;
