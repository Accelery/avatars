import { combine, createFace } from "./_lib";

export default {
  fetch(request: Request, env: Env): Response {
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
      env.ANALYTICS_ENGINE.writeDataPoint({
        blobs: [request.headers.get("referer") ?? "", avatarId],
        indexes: [pathId ?? "random"],
      });
    }

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "X-Genavatar-Id": avatarId,
        "Cache-Control": pathId
          ? "public, max-age=31536000, immutable"
          : "no-store",
      },
    });
  },
} satisfies ExportedHandler<Env>;
