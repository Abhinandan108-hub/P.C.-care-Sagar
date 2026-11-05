import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";
import { AuthRequest } from "./auth";

export function addRequestId(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

export function auditWriteRequests(req: Request, res: Response, next: NextFunction) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.on("finish", () => {
      if (res.statusCode < 200) return;
      const authReq = req as AuthRequest & { requestId?: string };
      if (mongoose.connection.readyState !== 1) {
        console.error("Could not save request audit log because MongoDB is unavailable:", {
          requestId: authReq.requestId || "unknown",
          path: req.path,
        });
        return;
      }
      void AuditLog.create({
        actor: authReq.user?._id ?? null,
        action: `${req.method} ${req.baseUrl}${req.path}`.slice(0, 200),
        method: req.method,
        path: `${req.baseUrl}${req.path}`.slice(0, 500),
        statusCode: res.statusCode,
        requestId: authReq.requestId || "unknown",
        ipAddress: req.ip,
        userAgent: req.get("user-agent")?.slice(0, 500) || null,
      }).catch((error: unknown) => {
        console.error("Could not save request audit log:", error);
      });
    });
  }
  next();
}
