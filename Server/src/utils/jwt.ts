import jwt from "jsonwebtoken";

const SECRET: string = process.env.JWT_SECRET || "secret";
const EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as any });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET);
}
