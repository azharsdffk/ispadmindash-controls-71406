// Shared CORS helper for backend functions.
// NOTE: With credentials enabled, Access-Control-Allow-Origin cannot be '*'.

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";

  const envAllowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "";
  const envAllowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const explicitAllowedOrigins = [
    envAllowedOrigin,
    ...envAllowedOrigins,
    "http://localhost:5173",
    "http://localhost:8080",
  ].filter(Boolean);

  const isAllowedBySuffix =
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovableproject.com");

  const isAllowedExplicit = explicitAllowedOrigins.includes(origin);
  const isAllowed = Boolean(origin) && (isAllowedExplicit || isAllowedBySuffix);

  const allowOrigin = isAllowed
    ? origin
    : explicitAllowedOrigins[0] || "";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}
