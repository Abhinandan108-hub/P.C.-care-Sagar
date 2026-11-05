import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as Request & { requestId?: string }).requestId || "unknown";
    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      requestId,
      errors: errors.array().map((error) =>
        error.type === "field"
          ? {
              location: error.location,
              path: error.path,
              message: error.msg,
            }
          : {
              type: error.type,
              message: error.msg,
            }
      ),
    });
  }
  next();
}
