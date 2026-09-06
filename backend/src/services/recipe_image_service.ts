import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/env";
import logger from "../config/logger";
import { cloudinaryService } from "./cloudinary_service";

export interface RecipeImageInput {
  title: string;
  ingredients?: { name: string }[];
  cuisine?: string;
  category?: string;
}

export interface RecipeImageResult {
  url: string;
  publicId?: string;
}

/**
 * Builds a descriptive culinary food photography prompt for text-to-image models.
 */
export function buildRecipeImagePrompt(recipe: RecipeImageInput): string {
  const title = recipe.title.trim();
  const cuisine = recipe.cuisine ? `${recipe.cuisine} ` : "";
  const keyIngredients = (recipe.ingredients || [])
    .slice(0, 3)
    .map(i => i.name)
    .join(", ");
  const ingText = keyIngredients ? `prepared with fresh ${keyIngredients}` : "";

  return `High-end professional food photography of authentic ${cuisine}${title}, ${ingText}, elegantly plated on tableware, soft natural restaurant lighting, beautiful garnish, shallow depth of field, appetizing 4k culinary presentation.`;
}

/**
 * Curated high-fidelity food photography URLs for common dish types.
 */
function getCuratedDishFallback(title: string): string | null {
  const t = title.toLowerCase();

  if (t.includes("kerala") || t.includes("sadya") || t.includes("avial") || t.includes("sambar") || t.includes("thoran")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"; // Kerala Sadya
  }
  if (t.includes("sushi") || t.includes("maki") || t.includes("sashimi") || t.includes("california roll")) {
    return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"; // Sushi
  }
  if (t.includes("noodle") || t.includes("ramen") || t.includes("chow mein") || t.includes("pad thai") || t.includes("soba")) {
    return "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80"; // Noodles
  }
  if (t.includes("pasta") || t.includes("spaghetti") || t.includes("lasagna") || t.includes("penne") || t.includes("fettuccine") || t.includes("macaroni")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"; // Pasta
  }
  if (t.includes("chicken") || t.includes("poultry") || t.includes("turkey") || t.includes("wings")) {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80"; // Chicken
  }
  if (t.includes("fish") || t.includes("salmon") || t.includes("shrimp") || t.includes("seafood") || t.includes("prawn") || t.includes("tuna")) {
    return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80"; // Seafood / Fish
  }
  if (t.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"; // Pizza
  }
  if (t.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"; // Burger
  }
  if (t.includes("salad") || t.includes("bowl") || t.includes("greens")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"; // Salad
  }
  if (t.includes("rice") || t.includes("biryani") || t.includes("pulao") || t.includes("fried rice") || t.includes("risotto")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80"; // Rice dish
  }
  if (t.includes("paneer") || t.includes("tofu") || t.includes("cottage cheese")) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"; // Paneer dish
  }
  if (t.includes("beef") || t.includes("steak") || t.includes("meat") || t.includes("lamb") || t.includes("ribs") || t.includes("pork")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"; // Steak / Meat
  }
  if (t.includes("soup") || t.includes("stew") || t.includes("broth")) {
    return "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=600&q=80"; // Soup
  }
  if (t.includes("egg") || t.includes("omelette") || t.includes("scramble") || t.includes("breakfast")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"; // Eggs
  }
  if (t.includes("chocolate") || t.includes("cake") || t.includes("dessert") || t.includes("brownie") || t.includes("cookie") || t.includes("sweet")) {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80"; // Dessert
  }
  if (t.includes("wrap") || t.includes("shawarma") || t.includes("sandwich") || t.includes("taco") || t.includes("burrito")) {
    return "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=600&q=80"; // Wrap / Sandwich
  }
  if (t.includes("avocado") || t.includes("guacamole")) {
    return "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80"; // Avocado
  }
  if (t.includes("chickpea") || t.includes("hummus") || t.includes("garbanzo")) {
    return "https://images.unsplash.com/photo-1585996726190-760772719d3f?auto=format&fit=crop&w=600&q=80"; // Chickpeas
  }

  return null;
}

const GENERIC_FOOD_FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80";

class RecipeImageService {
  /**
   * Generates a dish image via AI (Imagen 3), uploads to Cloudinary if available,
   * or falls back gracefully to Unsplash / curated photography.
   */
  public async resolveRecipeImage(recipe: RecipeImageInput): Promise<RecipeImageResult> {
    const title = recipe.title || "Delicious Meal";
    const prompt = buildRecipeImagePrompt(recipe);

    // 1. Attempt AI generation via Gemini Imagen 3 if API key exists
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" && ENV.GEMINI_API_KEY.trim() !== "") {
      try {
        logger.info(`Generating AI dish image with prompt: "${prompt}"`);
        const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
        
        const response = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "4:3",
          },
        });

        const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          const imageBuffer = Buffer.from(imageBytes, "base64");

          // Upload to Cloudinary if configured
          if (cloudinaryService.isAvailable()) {
            const uploadRes = await cloudinaryService.uploadRecipeImage(imageBuffer, title);
            if (uploadRes) {
              return uploadRes;
            }
          }

          // Return base64 data URI if Cloudinary is not configured
          const dataUri = `data:image/jpeg;base64,${imageBytes}`;
          return { url: dataUri };
        }
      } catch (error: any) {
        logger.warn("Imagen image generation failed, using photographic fallback:", error?.message || error);
      }
    }

    // 2. Unsplash API query fallback if key is configured
    const unsplashKey = ENV.RECIPE_IMAGE_API_KEY;
    if (unsplashKey) {
      try {
        const ingredientsText = (recipe.ingredients || []).slice(0, 2).map(i => i.name).join(" ");
        const searchQuery = `${title} ${ingredientsText}`.replace(/[^a-zA-Z0-9\s]/g, "").trim();
        logger.info(`Querying Unsplash API for: "${searchQuery}"`);

        const res = await axios.get("https://api.unsplash.com/search/photos", {
          params: { query: searchQuery, per_page: 1, orientation: "landscape" },
          headers: { Authorization: `Client-ID ${unsplashKey}` },
          timeout: 4000,
        });

        const unsplashUrl = res.data?.results?.[0]?.urls?.regular;
        if (unsplashUrl) {
          // If Cloudinary is available, optionally upload for permanence
          if (cloudinaryService.isAvailable()) {
            const uploadRes = await cloudinaryService.uploadRecipeImage(unsplashUrl, title);
            if (uploadRes) return uploadRes;
          }
          return { url: unsplashUrl };
        }
      } catch (err: any) {
        logger.warn("Unsplash API query failed:", err?.message || err);
      }
    }

    // 3. Curated authentic dish dictionary fallback
    const curatedUrl = getCuratedDishFallback(title);
    if (curatedUrl) {
      return { url: curatedUrl };
    }

    // 4. Final neutral food photography fallback
    return { url: GENERIC_FOOD_FALLBACK };
  }
}

export const recipeImageService = new RecipeImageService();

/**
 * Backward-compatible helper returning a direct image string URL.
 */
export const getRecipeImage = async (recipe: RecipeImageInput): Promise<string> => {
  const result = await recipeImageService.resolveRecipeImage(recipe);
  return result.url;
};
