import { NextFunction, Request, Response } from "express";

export function isAllowedImage(mimetype: string, bytes: Buffer) {
  if (mimetype === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
  }
  if (mimetype === "image/webp") {
    return bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

export function validateImageSignatures(req: Request, _res: Response, next: NextFunction) {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  if (files.some((file) => !isAllowedImage(file.mimetype, file.buffer))) {
    const error = new Error("Uploaded file content does not match an allowed image type");
    Object.assign(error, { status: 400 });
    return next(error);
  }
  return next();
}
