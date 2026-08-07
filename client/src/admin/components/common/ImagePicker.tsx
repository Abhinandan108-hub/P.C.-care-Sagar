import { useRef } from "react";
import toast from "react-hot-toast";
import { ImagePlus, X } from "lucide-react";
import { useImageUpload } from "../../hooks/useImageUpload";
import LoadingSpinner from "../LoadingSpinner";

interface ImagePickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label: string;
  hint?: string;
}

/** Single-image counterpart to the product ImageUploader — same visual
 * language, but lets the caller choose the storage folder and only ever
 * keeps one image. Used by Categories, Brands and Website Settings. */
export default function ImagePicker({
  value,
  onChange,
  folder,
  label,
  hint = "PNG or JPG, up to 5MB. Large images are compressed automatically.",
}: ImagePickerProps) {
  const { uploading, uploadOne } = useImageUpload(folder);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Upload Failed: image must be under 5MB.");
      return;
    }

    try {
      const url = await uploadOne(file);
      if (!url) {
        toast.error("Upload Failed");
        return;
      }
      onChange(url);
    } catch {
      toast.error("Upload Failed");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="admin-field admin-field--full">
      <label>{label}</label>

      {!value && (
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
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files)}
      />

      {uploading && (
        <div className="admin-uploader__uploading">
          <LoadingSpinner size="sm" />
          Uploading image…
        </div>
      )}

      {value && (
        <div className="admin-uploader__grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 320 }}>
          <div className="admin-uploader__thumb">
            <img src={value} alt={label} />
            <button
              type="button"
              className="admin-uploader__thumb-remove"
              onClick={() => onChange(null)}
              aria-label={`Remove ${label}`}
            >
              <X size={13} />
            </button>
          </div>
          <button
            type="button"
            className="admin-uploader__dropzone"
            style={{ aspectRatio: "1", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
