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
    // IMPORTANT:
    // Supabase client (and similar SDKs) send extra x-supabase-client-* headers.
    // If we don't allow them explicitly, browsers will block the request at
    // the preflight stage and the frontend will show:
    // "Failed to send a request to the Edge Function".
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}
