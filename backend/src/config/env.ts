import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../../.env") });

export const ENV = {
  PORT: process.env.PORT!,
  MONGO_URI: process.env.MONGO_URI!,
  NODE_ENV: process.env.NODE_ENV!,
  SALT_ROUND:process.env.SALT_ROUND!,
  ACCESS_TOKEN_SECRET:process.env.ACCESS_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRY:process.env.ACCESS_TOKEN_EXPIRY as string,
  REFRESH_TOKEN_SECRET:process.env.REFRESH_TOKEN_SECRET!,
  REFRESH_TOKEN_EXPIRY:process.env.REFRESH_TOKEN_EXPIRY as string,
  FRONTEND_URL:process.env.FRONTEND_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  FOOD_DATA_API_KEY: process.env.FOOD_DATA_API_KEY || "DEMO_KEY",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  RECIPE_IMAGE_API_KEY: process.env.RECIPE_IMAGE_API_KEY || process.env.UNSPLASH_ACCESS_KEY || "",
};

// Restart trigger