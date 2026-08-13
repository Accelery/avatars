/** Exact path segments (case-insensitive). First path segment only. */
const BLOCKED_EXACT = new Set([
  "robots.txt",
  "favicon.ico",
  "sitemap.xml",
  "apple-touch-icon.png",
  "manifest.json",
  "security.txt",
  ".env",
  ".git",
  ".well-known",
  "wp-login.php",
  "wp-admin",
  "xmlrpc.php",
  "admin",
  "login",
  "health",
  "healthz",
  "ready",
  "readiness",
  "metrics",
]);

/** Path prefixes (case-insensitive). Matched against the full path without leading /. */
const BLOCKED_PREFIXES = [
  "wp-",
  ".git/",
  ".env",
  "cgi-bin/",
  "vendor/",
  "node_modules/",
] as const;

/**
 * Returns true when the request path should not produce an avatar PNG.
 * Uses the full pathname (not the truncated avatar id).
 */
export function isBlockedPath(pathname: string): boolean {
  const path = pathname.replace(/^\/+/, "").toLowerCase();
  if (!path) {
    return false;
  }

  const firstSegment = path.split("/", 1)[0] ?? path;
  if (BLOCKED_EXACT.has(firstSegment)) {
    return true;
  }

  return BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix));
}
