import { type NextRequest } from "next/server";
import { verifyToken, type TokenPayload } from "./jwt";

/**
 * Reads the `session` httpOnly cookie from the incoming request,
 * verifies the JWT, and returns the decoded payload.
 *
 * Throws a `Response` with status 401 if the cookie is missing or invalid.
 * This Response can be returned directly from a route handler.
 */
export function requireAuth(request: NextRequest): TokenPayload {
  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie?.value) {
    throw new Response(
      JSON.stringify({ error: "Unauthorized", message: "No session cookie" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    return verifyToken(sessionCookie.value);
  } catch {
    throw new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid or expired session",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}
