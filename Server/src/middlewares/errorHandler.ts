import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import multer from "multer";

function getErrorDetails(error: unknown) {
  if (typeof error === "object" && error !== null) {
    return error as {
      status?: number;
      statusCode?: number;
      message?: string;
      name?: string;
      code?: number;
      errors?: Record<string, { message?: string }>;
    };
  }
  return {};
}

export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(error);

  const details = getErrorDetails(error);
  const requestedStatus = details.status || details.statusCode || 500;
  let status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus
    : 500;
  let message = status >= 500 ? "Internal server error" : details.message || "Request failed";

  if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Request data is invalid";
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Request contains an invalid identifier or value";
  } else if (details.code === 11000) {
    status = 409;
    message = "A record with the same unique value already exists";
  } else if (error instanceof multer.MulterError) {
    status = 400;
    message = error.message;
  } else if (details.name === "SyntaxError" && "body" in (error as object)) {
    status = 400;
    message = "Request contains invalid JSON";
  } else if (details.message === "Origin not allowed") {
    status = 403;
    message = "This origin is not allowed";
  }

  const requestId = (req as Request & { requestId?: string }).requestId || "unknown";
  if (status >= 500) {
    console.error("API request failed:", { requestId, method: req.method, path: req.path, error });
  }
  return res.status(status).json({
    success: false,
    message,
    requestId,
    ...(error instanceof mongoose.Error.ValidationError
      ? { errors: Object.values(error.errors).map((item) => item.message) }
      : {}),
  });
}
