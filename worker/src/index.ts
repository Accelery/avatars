import { combine, createFace } from "./_lib";
import { isBlockedPath } from "./_lib/blocked";

const NO_ROBOTS = "noindex, nofollow";
const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";
const CACHE_PATH_PREFIX = "/__cache/v2/";
const MAX_ID_CODE_POINTS = 36;
const MAX_REFERER_HOST = 96;
const MAX_REFERER_URL = 2048;

interface ParsedReferer {
  readonly host: string;
  readonly cleanUrl: string;
}

const safeDecodePath = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    // Malformed escapes stay literal so the ID remains deterministic.
    return raw;
  }
};

const parsePathId = (decodedPath: string): string | undefined => {
  const raw = decodedPath.slice(1);
  if (!raw) {
    return undefined;
  }
  return Array.from(raw).slice(0, MAX_ID_CODE_POINTS).join("");
};

const parseReferer = (raw: string | null): ParsedReferer => {
  if (!raw) {
    return { host: "", cleanUrl: "" };
  }
  try {
    const refUrl = new URL(raw);
    return {
      host: refUrl.hostname.slice(0, MAX_REFERER_HOST),
      cleanUrl: `${refUrl.origin}${refUrl.pathname}`.slice(
        0,
        MAX_REFERER_URL,
      ),
    };
  } catch {
    return { host: "", cleanUrl: "" };
  }
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const startMs = performance.now();

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: {
          Allow: "GET, HEAD",
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": NO_ROBOTS,
        },
      });
    }

    const url = new URL(request.url);
    const decodedPath = safeDecodePath(url.pathname);

    if (isBlockedPath(decodedPath)) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": NO_ROBOTS,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const pathId = parsePathId(decodedPath);
    const isNamed = pathId !== undefined;
    const avatarId = pathId ?? crypto.randomUUID();
    const headerSafeId = encodeURIComponent(avatarId);

    const face = createFace(avatarId);
    const cache = caches.default;
    const cacheKey = new Request(
      `${url.origin}${CACHE_PATH_PREFIX}${face.key}.png`,
    );
    const cached = await cache.match(cacheKey);
    const png = cached
      ? new Uint8Array(await cached.arrayBuffer())
      : combine(face);
    const cacheStatus = cached ? "HIT" : "MISS";

    if (!cached) {
      const cacheHeaders = { "Cache-Control": CACHE_CONTROL_IMMUTABLE };
      ctx.waitUntil(
        cache.put(cacheKey, new Response(png, { headers: cacheHeaders })),
      );
    }

    const noTrack = url.searchParams.get("notrack") === "true";
    if (!noTrack) {
      const referer = parseReferer(request.headers.get("referer"));
      const durationMs = performance.now() - startMs;
      const colo =
        typeof request.cf?.colo === "string" ? request.cf.colo : "";

      env.ANALYTICS_ENGINE.writeDataPoint({
        indexes: [referer.host || "direct"],
        blobs: [
          isNamed ? "named" : "random",
          referer.host,
          referer.cleanUrl,
          pathId ?? "",
          face.key,
          cacheStatus,
          colo,
        ],
        doubles: [
          1,
          durationMs,
          png.byteLength,
          cacheStatus === "HIT" ? 1 : 0,
        ],
      });
    }

    const headers = new Headers({
      "Content-Type": "image/png",
      "X-Genavatar-Id": headerSafeId,
      "X-Cache-Status": cacheStatus,
      "X-Robots-Tag": NO_ROBOTS,
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": isNamed ? CACHE_CONTROL_IMMUTABLE : "no-store",
    });

    return new Response(png, { status: 200, headers });
  },
} satisfies ExportedHandler<Env>;
