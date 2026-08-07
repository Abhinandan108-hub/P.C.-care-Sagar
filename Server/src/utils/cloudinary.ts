import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(filePath: string) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "pc-care-sagar/products",
    resource_type: "image",
  });
  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
