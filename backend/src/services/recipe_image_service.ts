import axios from "axios";
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
 * Every single URL represents an appetizing, beautifully plated, fully cooked meal (never raw meat or ingredients).
 */
function getCuratedDishFallback(title: string): string | null {
  const t = title.toLowerCase();

  // Indian Curries & Specialties
  if (t.includes("butter chicken") || t.includes("murgh makhani") || t.includes("makhani")) {
    return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80"; // Authentic rich Butter Chicken curry
  }
  if (t.includes("tikka masala") || t.includes("chicken tikka")) {
    return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80"; // Chicken Tikka Masala
  }
  if (t.includes("curry") || t.includes("korma")) {
    return "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80"; // Rich Indian Curry
  }
  if (t.includes("biryani") || t.includes("pulao")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"; // Biryani
  }
  if (t.includes("kerala") || t.includes("sadya") || t.includes("avial") || t.includes("sambar") || t.includes("thoran")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"; // Kerala Sadya
  }
  if (t.includes("dosa") || t.includes("idli") || t.includes("vada") || t.includes("uttapam")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80"; // South Indian Dosa / Breakfast
  }
  if (t.includes("paneer") || t.includes("palak paneer") || t.includes("shahi paneer") || t.includes("matar paneer")) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80"; // Paneer dish
  }
  if (t.includes("dal") || t.includes("lentil") || t.includes("chana") || t.includes("chickpea") || t.includes("rajma") || t.includes("hummus")) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80"; // Dal / Lentils
  }

  // Indian Sweets & Desserts (Mithai)
  if (t.includes("ladoo") || t.includes("laddu") || t.includes("besan") || t.includes("motichoor") || t.includes("mithai") || t.includes("peda") || t.includes("barfi")) {
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"; // Authentic Indian Sweet / Ladoo
  }
  if (t.includes("gulab jamun") || t.includes("jalebi") || t.includes("rasgulla") || t.includes("halwa") || t.includes("kheer") || t.includes("payasam")) {
    return "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80"; // Indian Dessert
  }

  // Chicken & Poultry (Cooked plated meals)
  if (t.includes("chicken") || t.includes("poultry") || t.includes("turkey") || t.includes("wings")) {
    return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80"; // Golden roasted cooked chicken dinner
  }

  // Seafood
  if (t.includes("fish") || t.includes("salmon") || t.includes("shrimp") || t.includes("seafood") || t.includes("prawn") || t.includes("tuna")) {
    return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"; // Seafood / Grilled Salmon
  }

  // Asian & Noodles
  if (t.includes("sushi") || t.includes("maki") || t.includes("sashimi") || t.includes("california roll")) {
    return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80"; // Sushi
  }
  if (t.includes("noodle") || t.includes("ramen") || t.includes("chow mein") || t.includes("pad thai") || t.includes("soba")) {
    return "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80"; // Noodles / Ramen
  }
  if (t.includes("fried rice") || t.includes("rice") || t.includes("risotto")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80"; // Fried Rice
  }

  // Western & Comfort Food
  if (t.includes("pasta") || t.includes("spaghetti") || t.includes("lasagna") || t.includes("penne") || t.includes("fettuccine") || t.includes("macaroni")) {
    return "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=800&q=80"; // Pasta
  }
  if (t.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"; // Pizza
  }
  if (t.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"; // Burger
  }
  if (t.includes("sandwich") || t.includes("wrap") || t.includes("shawarma") || t.includes("taco") || t.includes("burrito")) {
    return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"; // Sandwich / Wrap
  }
  if (t.includes("steak") || t.includes("beef") || t.includes("meat") || t.includes("lamb") || t.includes("ribs") || t.includes("pork")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"; // Steak / Plated Meat
  }
  if (t.includes("soup") || t.includes("stew") || t.includes("broth")) {
    return "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=800&q=80"; // Soup
  }
  if (t.includes("salad") || t.includes("bowl") || t.includes("greens")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"; // Fresh Salad
  }
  if (t.includes("egg") || t.includes("omelette") || t.includes("scramble") || t.includes("breakfast")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"; // Eggs / Breakfast
  }
  if (t.includes("smoothie") || t.includes("shake") || t.includes("juice")) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80"; // Smoothie
  }
  if (t.includes("chocolate") || t.includes("mousse") || t.includes("cake") || t.includes("dessert") || t.includes("brownie") || t.includes("cookie") || t.includes("sweet")) {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"; // Chocolate Dessert / Cake
  }
  if (t.includes("avocado") || t.includes("guacamole")) {
    return "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80"; // Avocado
  }

  return null;
}

const GENERIC_FOOD_FALLBACK = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";

class RecipeImageService {
  /**
   * Generates an authentic dish image via AI (Pollinations text-to-image), uploads to Cloudinary permanently,
   * or falls back gracefully to curated dish photography uploaded to Cloudinary.
   */
  public async resolveRecipeImage(recipe: RecipeImageInput): Promise<RecipeImageResult> {
    const title = recipe.title || "Delicious Meal";
    const prompt = buildRecipeImagePrompt(recipe);

    // 1. High-Fidelity AI Dish Generation via Pollinations -> Upload directly to Cloudinary
    try {
      logger.info(`Generating AI dish image for "${title}" with prompt: "${prompt}"`);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;

      if (cloudinaryService.isAvailable()) {
        const uploadRes = await cloudinaryService.uploadRecipeImage(pollinationsUrl, title);
        if (uploadRes) {
          logger.info(`AI dish image saved to Cloudinary: ${uploadRes.url}`);
          return uploadRes;
        }
      }
      return { url: pollinationsUrl };
    } catch (aiErr: any) {
      logger.warn("Pollinations AI generation failed, falling back to curated dish image:", aiErr?.message || aiErr);
    }

    // 2. Curated authentic dish dictionary fallback
    const curatedUrl = getCuratedDishFallback(title);
    if (curatedUrl) {
      if (cloudinaryService.isAvailable()) {
        const uploadRes = await cloudinaryService.uploadRecipeImage(curatedUrl, title);
        if (uploadRes) return uploadRes;
      }
      return { url: curatedUrl };
    }

    // 3. Category-specific neutral food photography fallback
    const category = (recipe.category || "").toLowerCase();
    const t = title.toLowerCase();
    let fallbackUrl = GENERIC_FOOD_FALLBACK;
    if (category.includes("dessert") || category.includes("sweet") || t.includes("sweet") || t.includes("dessert") || t.includes("ladoo") || t.includes("cake")) {
      fallbackUrl = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"; // Dessert
    } else if (category.includes("breakfast")) {
      fallbackUrl = "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"; // Breakfast
    }

    if (cloudinaryService.isAvailable()) {
      const uploadRes = await cloudinaryService.uploadRecipeImage(fallbackUrl, title);
      if (uploadRes) return uploadRes;
    }
    return { url: fallbackUrl };
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
