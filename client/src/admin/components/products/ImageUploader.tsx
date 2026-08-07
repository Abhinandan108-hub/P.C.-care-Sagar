import { useRef } from "react";
import toast from "react-hot-toast";
import { ImagePlus, X } from "lucide-react";
import { useUploadImage } from "../../hooks/useUploadImage";
import LoadingSpinner from "../LoadingSpinner";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  hint?: string;
}

export default function ImageUploader({
  images,
  onChange,
  multiple = false,
  maxFiles = multiple ? 8 : 1,
  label = "Product Image",
  hint = "PNG or JPG, up to 5MB each. Large images are compressed automatically.",
}: ImageUploaderProps) {
  const { uploading, uploadOne, uploadMany } = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const remainingSlots = maxFiles - images.length;

    if (remainingSlots <= 0) {
      toast.error(`You can only add up to ${maxFiles} image${maxFiles > 1 ? "s" : ""}.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const oversized = filesToUpload.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error("Upload Failed: each image must be under 5MB.");
      return;
    }

    try {
      if (multiple) {
        const urls = await uploadMany(filesToUpload);
        if (urls.length === 0) {
          toast.error("Upload Failed");
          return;
        }
        onChange([...images, ...urls]);
      } else {
        const url = await uploadOne(filesToUpload[0]);
        if (!url) {
          toast.error("Upload Failed");
          return;
        }
        onChange([url]);
      }
    } catch {
      toast.error("Upload Failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(url: string) {
    onChange(images.filter((img) => img !== url));
  }

  return (
    <div className="admin-field admin-field--full">
      <label>{label}</label>

      <div
        className="admin-uploader__dropzone"
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <ImagePlus size={22} />
        <div>
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div className="admin-uploader__hint">{hint}</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="admin-uploader__uploading">
          <LoadingSpinner size="sm" />
          Uploading image{multiple ? "s" : ""}…
        </div>
      )}

      {images.length > 0 && (
        <div className="admin-uploader__grid">
          {images.map((url, idx) => (
            <div className="admin-uploader__thumb" key={url}>
              <img src={url} alt={`Upload ${idx + 1}`} />
              <button
                type="button"
                className="admin-uploader__thumb-remove"
                onClick={() => handleRemove(url)}
                aria-label="Remove image"
              >
                <X size={13} />
              </button>
              {idx === 0 && !multiple ? (
                <span className="admin-uploader__thumb-badge">Primary</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
