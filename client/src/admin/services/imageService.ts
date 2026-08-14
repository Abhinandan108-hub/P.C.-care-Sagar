import imageCompression from "browser-image-compression";
import { adminClient } from "../lib/adminClient";

const BUCKET = "products";
const MAX_SIZE_MB = 1;
const COMPRESS_THRESHOLD_MB = 1; // only compress files larger than this

function randomFileName(originalName: string) {
  const ext = originalName.includes(".")
    ? originalName.split(".").pop()
    : "jpg";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

/** Compress an image client-side if it's larger than the threshold. */
export async function compressIfNeeded(file: File): Promise<File> {
  if (file.size / (1024 * 1024) <= COMPRESS_THRESHOLD_MB) {
    return file;
  }
  try {
    return await imageCompression(file, {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    // If compression fails for any reason, fall back to the original file
    // rather than blocking the upload.
    return file;
  }
}

/** Compress + upload a single image, returning its public URL. */
export async function uploadProductImage(
  file: File,
  folder: string = "products"
): Promise<string> {
  const compressed = await compressIfNeeded(file);
  const path = `${folder}/${randomFileName(file.name)}`;

  const { error } = await adminClient.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
    contentType: compressed.type || file.type,
  });

  if (error) throw error;

  const { data } = adminClient.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload multiple images in parallel, returning their public URLs in order. */
export async function uploadProductImages(
  files: File[],
  folder: string = "products"
): Promise<string[]> {
  return Promise.all(files.map((file) => uploadProductImage(file, folder)));
}
