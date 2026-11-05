import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export async function uploadImage(filePath: string) {
  configureCloudinary();
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "pc-care-sagar/products",
    resource_type: "image",
  });
  return {
    url: result.secure_url,
    public_id: result.public_id,
  };
}

export async function uploadServiceImage(file: Buffer) {
  configureCloudinary();
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: "pc-care-sagar/service-requests",
          resource_type: "image",
        },
        (error, uploaded) => {
          if (error) return reject(error);
          if (!uploaded) return reject(new Error("Image upload did not return a result"));
          resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
        }
      );
      upload.end(file);
    }
  );
  return { url: result.secure_url, public_id: result.public_id };
}

export async function deleteImage(publicId: string) {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
