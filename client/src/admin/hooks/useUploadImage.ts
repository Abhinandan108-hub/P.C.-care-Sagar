import { useState } from "react";
import { uploadProductImage, uploadProductImages } from "../services/imageService";

interface UseUploadImageResult {
  uploading: boolean;
  error: string | null;
  uploadOne: (file: File) => Promise<string | null>;
  uploadMany: (files: File[]) => Promise<string[]>;
}

export function useUploadImage(): UseUploadImageResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<string | null> {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProductImage(file);
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
      const urls = await uploadProductImages(files);
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
