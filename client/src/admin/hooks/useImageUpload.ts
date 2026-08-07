import { useState } from "react";
import { uploadProductImage, uploadProductImages } from "../services/imageService";

interface UseImageUploadResult {
  uploading: boolean;
  error: string | null;
  uploadOne: (file: File) => Promise<string | null>;
  uploadMany: (files: File[]) => Promise<string[]>;
}

/**
 * Same behaviour as useUploadImage, but lets the caller choose which folder
 * inside the shared "products" storage bucket the file is stored under
 * (e.g. "categories", "brands", "site"). Kept as a separate hook so the
 * existing product upload flow is never touched.
 */
export function useImageUpload(folder: string): UseImageUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<string | null> {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file, folder);
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function uploadMany(files: File[]): Promise<string[]> {
    if (files.length === 0) return [];
    setUploading(true);
    setError(null);
    try {
      const urls = await uploadProductImages(files, folder);
      return urls;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
      return [];
    } finally {
      setUploading(false);
    }
  }

  return { uploading, error, uploadOne, uploadMany };
}
