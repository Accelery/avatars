import { combine, createFace } from "./_lib";
import { isBlockedPath } from "./_lib/blocked";

const NO_ROBOTS = "noindex, nofollow";

export default {
  fetch(request: Request, env: Env): Response {
    const url = new URL(request.url);

    if (isBlockedPath(url.pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": NO_ROBOTS,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

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
        "X-Robots-Tag": NO_ROBOTS,
        "Cache-Control": pathId
          ? "public, max-age=31536000, immutable"
          : "no-store",
      },
    });
  },
} satisfies ExportedHandler<Env>;
