import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { ENV } from "../config/env";
import logger from "../config/logger";

class CloudinaryService {
  private isConfigured: boolean = false;

  constructor() {
    if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
        api_key: ENV.CLOUDINARY_API_KEY,
        api_secret: ENV.CLOUDINARY_API_SECRET,
        secure: true,
      });
      this.isConfigured = true;
      logger.info("CloudinaryService initialized successfully via API keys");
    } else if (ENV.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: ENV.CLOUDINARY_URL,
        secure: true,
      });
      this.isConfigured = true;
      logger.info("CloudinaryService initialized successfully via CLOUDINARY_URL");
    } else {
      logger.warn("Cloudinary credentials not configured. Image uploads will fall back to direct photography URLs.");
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Uploads an image buffer or base64 data URI to Cloudinary.
   * Returns secure_url and public_id, or null if unconfigured or failed.
   */
  public async uploadRecipeImage(
    imageData: Buffer | string,
    publicIdHint?: string
  ): Promise<{ url: string; publicId: string } | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const folder = "nutriverse_recipes";
      const sanitizedId = publicIdHint
        ? publicIdHint.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 40) + "_" + Date.now()
        : "recipe_" + Date.now();

      if (Buffer.isBuffer(imageData)) {
        return new Promise((resolve) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: sanitizedId,
              resource_type: "image",
              format: "jpg",
            },
            (error: any, result: UploadApiResponse | undefined) => {
              if (error || !result) {
                logger.error("Cloudinary buffer upload error:", error?.message || error);
                return resolve(null);
              }
              logger.info(`Cloudinary image uploaded successfully: ${result.secure_url}`);
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          );
          uploadStream.end(imageData);
        });
      }

      // String: data URI or remote URL
      const result = await cloudinary.uploader.upload(imageData, {
        folder,
        public_id: sanitizedId,
        resource_type: "image",
      });

      logger.info(`Cloudinary image uploaded successfully: ${result.secure_url}`);
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      logger.error("Cloudinary upload failed:", error?.message || error);
      return null;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
