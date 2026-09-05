import axios from "axios";
import logger from "../config/logger";

export const getRecipeImage = async (recipe: { title: string; ingredients: { name: string }[]; cuisine?: string; category?: string }): Promise<string> => {
  const title = recipe.title;
  const t = title.toLowerCase();
  
  // 1. Try querying Unsplash Developer API if a key is configured
  const apiKey = process.env.RECIPE_IMAGE_API_KEY || process.env.UNSPLASH_ACCESS_KEY;
  if (apiKey) {
    try {
      const mainIngredients = recipe.ingredients.slice(0, 2).map(i => i.name).join(" ");
      const query = `${title} ${mainIngredients}`.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      logger.info(`Querying Unsplash API for image with query: "${query}"`);
      
      const response = await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query: query,
          per_page: 1,
          orientation: "landscape"
        },
        headers: {
          Authorization: `Client-ID ${apiKey}`
        }
      });
      const url = response.data?.results?.[0]?.urls?.regular;
      if (url) {
        logger.info(`Unsplash resolved image: ${url}`);
        return url;
      }
    } catch (err: any) {
      logger.error("Error querying Unsplash API, falling back:", err.message);
    }
  }

  // 2. High-fidelity specific keyword dictionary fallback (Strict 1-to-1 matching)
  if (t.includes("kerala") || t.includes("avial") || t.includes("sambar") || t.includes("sadya")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"; // Kerala Sadya South Indian meal
  }
  if (t.includes("noodle") || t.includes("noodles") || t.includes("ramen") || t.includes("chow mein") || t.includes("pad thai")) {
    return "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80"; // Noodles
  }
  if (t.includes("chicken") || t.includes("turkey") || t.includes("poultry") || t.includes("breast")) {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80"; // Grilled chicken
  }
  if (t.includes("sushi")) {
    return "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"; // Sushi
  }
  if (t.includes("avocado") || t.includes("guacamole")) {
    return "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80"; // Avocado
  }
  if (t.includes("chickpea") || t.includes("hummus") || t.includes("garbanzo")) {
    return "https://images.unsplash.com/photo-1585996726190-760772719d3f?auto=format&fit=crop&w=600&q=80"; // Chickpeas
  }
  if (t.includes("pasta") || t.includes("spaghetti") || t.includes("lasagna") || t.includes("penne") || t.includes("macaroni")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"; // Pasta
  }
  if (t.includes("rice") || t.includes("pulao") || t.includes("fried rice") || t.includes("risotto") || t.includes("matta")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80"; // Rice dish
  }
  if (t.includes("paneer") || t.includes("tofu") || t.includes("cottage cheese")) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"; // Paneer/Tofu dish
  }
  if (t.includes("beef") || t.includes("steak") || t.includes("pork") || t.includes("meat") || t.includes("lamb") || t.includes("ribs")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"; // Steak / Meat
  }
  if (t.includes("fish") || t.includes("salmon") || t.includes("shrimp") || t.includes("seafood") || t.includes("prawn") || t.includes("lobster")) {
    return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80"; // Seafood / Salmon
  }
  if (t.includes("salad")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"; // Salad
  }
  if (t.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"; // Pizza
  }
  if (t.includes("soup") || t.includes("stew") || t.includes("broth")) {
    return "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=600&q=80"; // Soup
  }
  if (t.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"; // Burger
  }
  if (t.includes("egg") || t.includes("eggs") || t.includes("omelette") || t.includes("scramble")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"; // Eggs / Breakfast
  }
  if (t.includes("chocolate") || t.includes("cake") || t.includes("dessert") || t.includes("brownie") || t.includes("cookie") || t.includes("sweet")) {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80"; // Dessert
  }
  if (t.includes("wrap") || t.includes("shawarma") || t.includes("sandwich") || t.includes("taco") || t.includes("burrito")) {
    return "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=600&q=80"; // Wrap / Sandwich
  }

  // Generic fallback: a neutral premium food photo
  return "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80"; 
};
