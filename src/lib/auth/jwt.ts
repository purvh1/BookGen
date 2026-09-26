import jwt from "jsonwebtoken";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: number;
  email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. The application cannot start without it."
    );
  }
  return secret;
}

/**
 * Signs a JWT with the given payload.
 * Expires in 24 hours.
 * Throws if JWT_SECRET is not configured.
 */
export function signToken(payload: TokenPayload): string {
  const secret = getSecret();
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

/**
 * Verifies and decodes a JWT token.
 * Throws if the token is invalid, expired, or JWT_SECRET is not configured.
 */
export function verifyToken(token: string): TokenPayload {
  const secret = getSecret();
  const decoded = jwt.verify(token, secret);
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as TokenPayload).userId !== "number" ||
    typeof (decoded as TokenPayload).email !== "string"
  ) {
    throw new Error("Invalid token payload");
  }
  const { userId, email } = decoded as TokenPayload;
  return { userId, email };
}
