
import dotenv from "dotenv";
import path from "path";
import jwt, { SignOptions } from "jsonwebtoken";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

const ACCESS_TOKEN_EXPIRES_IN =
  (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];

export interface TokenPayload {
  userId: string;
  sessionId: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret());

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    typeof decoded.sessionId !== "string"
  ) {
    throw new Error("Invalid access token");
  }

  return {
    userId: decoded.userId,
    sessionId: decoded.sessionId,
  };
}
