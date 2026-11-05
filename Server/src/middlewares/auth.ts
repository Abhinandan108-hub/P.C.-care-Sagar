
import { Request, Response, NextFunction } from "express";
import User, { UserRole } from "../models/User";
import RefreshSession from "../models/RefreshSession";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: InstanceType<typeof User>;
  sessionId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }

  try {
    const [user, session] = await Promise.all([
      User.findById(payload.userId),
      RefreshSession.findOne({
        _id: payload.sessionId,
        userId: payload.userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      }),
    ]);

    if (!user || !session) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or expired",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated",
      });
    }

    req.user = user;
    req.sessionId = session.id;

    next();
  } catch (error) {
    return next(error);
  }
}

export function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}

export function authorizeRoles(...roles: UserRole[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
}

export function authorizePermissions(...permissions: string[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role === "admin") return next();
    const hasPermission = permissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }
    return next();
  };
}
