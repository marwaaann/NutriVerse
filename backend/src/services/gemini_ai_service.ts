import { GoogleGenAI } from "@google/genai";
import { IAIService } from "../interface/IAIService";
import { ENV } from "../config/env";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { z } from "zod";

// Zod validation schemas
const ingredientItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string(),
  isEstimatedQuantity: z.boolean().optional(),
});

const ingredientsArraySchema = z.object({
  ingredients: z.array(ingredientItemSchema),
});

const generatedRecipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  mealType: z.string().min(1, "Meal type is required"),
  cuisine: z.string().min(1, "Cuisine is required"),
  servings: z.number().positive("Servings must be positive"),
  prepTime: z.number().nonnegative(),
  cookTime: z.number().nonnegative(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "Ingredient name is required"),
      quantity: z.number().positive("Quantity must be positive"),
      unit: z.string().min(1, "Unit is required")
    })
  ).min(1, "Ingredients required"),
  instructions: z.array(z.string().min(1)).min(1, "Instructions required"),
  dietaryTags: z.array(z.string()),
  difficulty: z.string(),
  tips: z.array(z.string()),
  conflictResolution: z.string().optional()
});

export class GeminiAIService implements IAIService {
  private ai: GoogleGenAI;
  private modelName = ENV.GEMINI_MODEL;

  constructor() {
    const key = ENV.GEMINI_API_KEY || "";
    if (!key || key === "YOUR_GEMINI_API_KEY") {
      logger.warn("GeminiAIService: GEMINI_API_KEY is not defined. Falling back to mockup assistant.");
    }
    this.ai = new GoogleGenAI({ apiKey: key || "MOCK_KEY" });
  }

  private hasApiKey(): boolean {
    const key = ENV.GEMINI_API_KEY;
    return !!(key && key !== "YOUR_GEMINI_API_KEY" && key.trim() !== "");
  }

  async normalizeIngredients(
    ingredientsList: string
  ): Promise<Array<{
    name: string;
    quantity: number;
    unit: string;
    isEstimatedQuantity?: boolean;
  }>> {
    try {
      logger.debug(`GeminiAIService: Normalizing ingredients: "${ingredientsList}"`);

      if (!this.hasApiKey()) {
        logger.info("GeminiAIService fallback: parsing ingredients manually");
        return ingredientsList.split(",").map(ing => {
          return { name: ing.trim(), quantity: 1, unit: "unit", isEstimatedQuantity: true };
        });
      }

      const prompt = `Convert the following natural-language ingredient description into structured JSON containing a list of ingredients. For vague quantities like "a little" or "to taste", estimate a reasonable default value and set "isEstimatedQuantity" to true:
"${ingredientsList}"`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              ingredients: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    quantity: { type: "NUMBER" },
                    unit: { type: "STRING" },
                    isEstimatedQuantity: { type: "BOOLEAN" },
                  },
                  required: ["name", "quantity", "unit"],
                },
              },
            },
            required: ["ingredients"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new AppError("Empty response received from Gemini", 500);
      }

      const parsedJSON = JSON.parse(responseText);
      const validated = ingredientsArraySchema.parse(parsedJSON);

      return validated.ingredients;
    } catch (error) {
      logger.error("GeminiAIService: Error in normalizeIngredients:", error);
      if (error instanceof z.ZodError) {
        throw new AppError("AI generated an invalid ingredients structure", 500);
      }
      throw error;
    }
  }

  async generateRecipeAnalysis(recipeContext: {
    title: string;
    ingredients: string[];
    nutrition: Record<string, number>;
    servings: number;
  }): Promise<string> {
    try {
      logger.debug(`GeminiAIService: Analyzing recipe "${recipeContext.title}"`);

      if (!this.hasApiKey()) {
        return "AI service is currently unavailable. Please configure the Gemini API key.";
      }

      const prompt = `Provide a comprehensive but concise nutrition and health analysis for the recipe "${recipeContext.title}".
Context details:
- Servings: ${recipeContext.servings}
- Ingredients: ${recipeContext.ingredients.join(", ")}
- Total Nutrition: ${JSON.stringify(recipeContext.nutrition)}

Highlight the macronutrient profile, potential health benefits, and any health alerts (e.g., high sodium or high sugar).`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text || "No analysis generated.";
    } catch (error) {
      logger.error("GeminiAIService: Error in generateRecipeAnalysis:", error);
      throw new AppError("AI failed to generate recipe analysis", 500);
    }
  }

  async answerRecipeQuestion(
    question: string,
    recipeContext: Record<string, any>
  ): Promise<string> {
    try {
      logger.debug(`GeminiAIService: Answering recipe question: "${question}"`);

      if (!this.hasApiKey()) {
        return "AI service is currently unavailable. Please configure the Gemini API key.";
      }

      const prompt = `You are a context-aware nutrition and recipe assistant. Answer the user's question about the recipe.
CRITICAL INSTRUCTION: Prioritize stored recipe data, ingredients, and stored nutrition data rather than inventing information. If the answer is not available or cannot be reasonably inferred from the recipe context, clearly state that you do not have enough information.

Recipe Context:
${JSON.stringify(recipeContext, null, 2)}

User Question:
"${question}"`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text || "No response generated.";
    } catch (error: any) {
      logger.error("[GEMINI ERROR]");
      logger.error(`status: ${error.status || error.code || "unknown"}`);
      logger.error(`message: ${error.message}`);
      logger.error(`model: ${this.modelName}`);

      const status = error.status || error.code;
      if (status === 429) {
        return "AI service is currently busy. Please wait a moment before sending another message.";
      } else if (status === 401 || status === 403) {
        return "Authentication with the AI service failed. Please check backend configuration.";
      }
      return "AI service is temporarily unavailable. Please try again later.";
    }
  }

  async suggestRecipeModification(
    recipeContext: Record<string, any>,
    suggestion: string
  ): Promise<string> {
    try {
      logger.debug(`GeminiAIService: Suggesting recipe modification for suggestion: "${suggestion}"`);

      if (!this.hasApiKey()) {
        return "AI service is currently unavailable. Please configure the Gemini API key.";
      }

      const prompt = `Analyze the recipe context and provide suggestions to modify the recipe for "${suggestion}".
CRITICAL INSTRUCTION: Prioritize stored recipe data. Recommend practical substitutions and describe their nutritional impacts.

Recipe Context:
${JSON.stringify(recipeContext, null, 2)}

Requested modification:
"${suggestion}"`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text || "No modification suggestions generated.";
    } catch (error) {
      logger.error("GeminiAIService: Error in suggestRecipeModification:", error);
      throw new AppError("AI failed to suggest recipe modification", 500);
    }
  }

  private getFallbackMealPlan(dateStr: string): any {
    const date = new Date(dateStr);
    const day = isNaN(date.getTime()) ? 0 : date.getDay(); // 0 is Sunday, 6 is Saturday

    const plans = [
      // 0: Sunday
      {
        breakfast: { title: "Poha with Peas & Peanuts", reason: "Light and popular Indian breakfast option.", calories: 300, protein: 8, carbs: 45, fat: 10, servings: 2 },
        lunch: { title: "Paneer Tikka Masala & Naan", reason: "Rich North Indian vegetarian lunch target.", calories: 600, protein: 20, carbs: 65, fat: 28, servings: 2 },
        snack: { title: "Fresh Fruit Salad", reason: "Nutrient-packed refresh option.", calories: 150, protein: 2, carbs: 35, fat: 1, servings: 2 },
        dinner: { title: "Chicken Biryani with Raita", reason: "Flavorful and high protein dinner choice.", calories: 650, protein: 42, carbs: 70, fat: 20, servings: 2 }
      },
      // 1: Monday
      {
        breakfast: { title: "Oatmeal with Bananas", reason: "Fiber-rich slow release carb breakfast.", calories: 280, protein: 10, carbs: 50, fat: 5, servings: 2 },
        lunch: { title: "Vegetable Biryani with Raita", reason: "Traditional spiced vegetarian rice dish.", calories: 520, protein: 14, carbs: 80, fat: 16, servings: 2 },
        snack: { title: "Apple slices with Almond Butter", reason: "Healthy fats and vitamins quick snack.", calories: 200, protein: 5, carbs: 22, fat: 12, servings: 2 },
        dinner: { title: "Tofu Stir-Fry with Broccoli", reason: "Low calorie, high protein plant-based dinner.", calories: 380, protein: 24, carbs: 30, fat: 14, servings: 2 }
      },
      // 2: Tuesday
      {
        breakfast: { title: "Avocado Toast & Egg", reason: "Healthy monounsaturated fats and quality proteins.", calories: 340, protein: 14, carbs: 25, fat: 20, servings: 2 },
        lunch: { title: "Chicken Tikka Wrap & Salad", reason: "High-protein portable lunch option.", calories: 580, protein: 38, carbs: 45, fat: 18, servings: 2 },
        snack: { title: "Mixed Roasted Nuts", reason: "Energy dense healthy minerals source.", calories: 220, protein: 7, carbs: 8, fat: 19, servings: 2 },
        dinner: { title: "Baked Fish with Quinoa", reason: "Omega-3 rich lean dinner choice.", calories: 450, protein: 35, carbs: 40, fat: 12, servings: 2 }
      },
      // 3: Wednesday
      {
        breakfast: { title: "Idli with Sambar", reason: "Steam cooked, fermented easy-to-digest choice.", calories: 260, protein: 8, carbs: 50, fat: 2, servings: 2 },
        lunch: { title: "Chana Masala & Rice", reason: "Fiber-rich plant protein lunch choice.", calories: 480, protein: 16, carbs: 75, fat: 10, servings: 2 },
        snack: { title: "Hummus with Cucumber Sticks", reason: "Hydrating, low-glycemic quick snack.", calories: 140, protein: 4, carbs: 15, fat: 8, servings: 2 },
        dinner: { title: "Lentil Soup (Dal) & Roti", reason: "Hearty, comforting homestyle meal.", calories: 410, protein: 18, carbs: 65, fat: 8, servings: 2 }
      },
      // 4: Thursday
      {
        breakfast: { title: "Masala Omelette & Toast", reason: "Classic high-protein breakfast choice.", calories: 350, protein: 20, carbs: 28, fat: 16, servings: 2 },
        lunch: { title: "Chicken Shawarma Bowl", reason: "High protein, low carb Mediterranean target.", calories: 540, protein: 40, carbs: 35, fat: 20, servings: 2 },
        snack: { title: "Greek Yogurt with Berries", reason: "Probiotic and antioxidant rich light choice.", calories: 180, protein: 12, carbs: 20, fat: 4, servings: 2 },
        dinner: { title: "Paneer & Sauteed Veggies", reason: "Rich in calcium and essential vitamins.", calories: 430, protein: 22, carbs: 18, fat: 30, servings: 2 }
      },
      // 5: Friday
      {
        breakfast: { title: "Chia Seed Pudding", reason: "Superfood breakfast packed with omega-3s.", calories: 240, protein: 6, carbs: 30, fat: 10, servings: 2 },
        lunch: { title: "Fish Curry & Brown Rice", reason: "Lean protein with complex grains.", calories: 510, protein: 32, carbs: 60, fat: 12, servings: 2 },
        snack: { title: "Carrot Sticks & Guacamole", reason: "Beta-carotene and healthy fats boost.", calories: 160, protein: 2, carbs: 18, fat: 10, servings: 2 },
        dinner: { title: "Egg Salad Wrap", reason: "Quick, satisfying protein evening choice.", calories: 390, protein: 18, carbs: 32, fat: 18, servings: 2 }
      },
      // 6: Saturday
      {
        breakfast: { title: "Pancakes with Berries", reason: "Delicious weekend reward breakfast.", calories: 420, protein: 10, carbs: 70, fat: 8, servings: 2 },
        lunch: { title: "Rajma Masala & Jeera Rice", reason: "Classic North Indian comfort protein lunch.", calories: 530, protein: 18, carbs: 85, fat: 12, servings: 2 },
        snack: { title: "Roasted Chickpeas", reason: "Crunchy, high-fiber satisfying snack.", calories: 160, protein: 8, carbs: 22, fat: 4, servings: 2 },
        dinner: { title: "Tomato Basil Pasta & Tofu", reason: "Lycopene-rich pasta with lean soy protein.", calories: 480, protein: 22, carbs: 65, fat: 12, servings: 2 }
      }
    ];

    return plans[day] || plans[0];
  }

  async generateMealPlan(
    preferencesContext: Record<string, any>,
    availableRecipes: any[],
    dateStr?: string
  ): Promise<any> {
    try {
      logger.debug("GeminiAIService: Generating structured meal plan");

      if (!this.hasApiKey()) {
        logger.info("GeminiAIService fallback: returning pre-defined meal plan");
        return this.getFallbackMealPlan(dateStr || "");
      }

      const prompt = `You are a personalized meal-planning assistant for a household. Build a full-day meal plan (Breakfast, Lunch, Snack, Dinner) matching the household profile:
Preferences and constraints:
${JSON.stringify(preferencesContext, null, 2)}

Available recipe collection context:
${JSON.stringify(availableRecipes.map(r => ({
  id: r._id,
  title: r.title,
  category: r.category,
  cookingTime: r.cookingTime,
  servings: r.servings,
  nutrition: r.nutrition || {}
})), null, 2)}

CRITICAL REQUIREMENT:
1. STRICTLY satisfy all allergies listed in the preferences (MUST NOT contain any ingredients that the user is allergic to).
2. Choose recipes from the available recipe collection when appropriate. If no suitable recipe is in the collection, suggest a new recipe with a title, default servings, estimated calories, protein, carbs, fat, and a "reason" matching the user's cuisine/preference.
3. Return the response strictly as valid JSON structure matching:
{
  "breakfast": { "recipeId": "optional database recipe id", "title": "recipe title", "reason": "why this matches preferences", "calories": 400, "protein": 25, "carbs": 40, "fat": 12, "servings": 2 },
  "lunch": { "recipeId": "optional database recipe id", "title": "recipe title", "reason": "why this matches preferences", "calories": 600, "protein": 40, "carbs": 60, "fat": 18, "servings": 2 },
  "snack": { "recipeId": "optional database recipe id", "title": "recipe title", "reason": "why this matches preferences", "calories": 200, "protein": 10, "carbs": 25, "fat": 6, "servings": 2 },
  "dinner": { "recipeId": "optional database recipe id", "title": "recipe title", "reason": "why this matches preferences", "calories": 500, "protein": 35, "carbs": 50, "fat": 15, "servings": 2 }
}`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              breakfast: {
                type: "OBJECT",
                properties: {
                  recipeId: { type: "STRING" },
                  title: { type: "STRING" },
                  reason: { type: "STRING" },
                  calories: { type: "NUMBER" },
                  protein: { type: "NUMBER" },
                  carbs: { type: "NUMBER" },
                  fat: { type: "NUMBER" },
                  servings: { type: "NUMBER" }
                },
                required: ["title", "reason", "calories", "protein", "carbs", "fat", "servings"]
              },
              lunch: {
                type: "OBJECT",
                properties: {
                  recipeId: { type: "STRING" },
                  title: { type: "STRING" },
                  reason: { type: "STRING" },
                  calories: { type: "NUMBER" },
                  protein: { type: "NUMBER" },
                  carbs: { type: "NUMBER" },
                  fat: { type: "NUMBER" },
                  servings: { type: "NUMBER" }
                },
                required: ["title", "reason", "calories", "protein", "carbs", "fat", "servings"]
              },
              snack: {
                type: "OBJECT",
                properties: {
                  recipeId: { type: "STRING" },
                  title: { type: "STRING" },
                  reason: { type: "STRING" },
                  calories: { type: "NUMBER" },
                  protein: { type: "NUMBER" },
                  carbs: { type: "NUMBER" },
                  fat: { type: "NUMBER" },
                  servings: { type: "NUMBER" }
                },
                required: ["title", "reason", "calories", "protein", "carbs", "fat", "servings"]
              },
              dinner: {
                type: "OBJECT",
                properties: {
                  recipeId: { type: "STRING" },
                  title: { type: "STRING" },
                  reason: { type: "STRING" },
                  calories: { type: "NUMBER" },
                  protein: { type: "NUMBER" },
                  carbs: { type: "NUMBER" },
                  fat: { type: "NUMBER" },
                  servings: { type: "NUMBER" }
                },
                required: ["title", "reason", "calories", "protein", "carbs", "fat", "servings"]
              }
            },
            required: ["breakfast", "lunch", "snack", "dinner"]
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      logger.error("GeminiAIService error, returning fallback plan:", error);
      return this.getFallbackMealPlan(dateStr || "");
    }
  }

  async suggestMealSwaps(
    preferencesContext: Record<string, any>,
    mealType: string,
    currentMeal: any
  ): Promise<any> {
    try {
      logger.debug("GeminiAIService: Suggesting alternatives for swap");

      if (!this.hasApiKey()) {
        logger.info("GeminiAIService fallback: returning pre-defined alternatives");
        return {
          options: [
            { title: "Grilled Chicken Salad", reason: "Healthy high protein swap option.", calories: 400, protein: 35, carbs: 15, fat: 18, servings: 2 },
            { title: "Paneer Butter Wrap", reason: "Balanced vegetarian alternative option.", calories: 500, protein: 18, carbs: 45, fat: 22, servings: 2 },
            { title: "Tuna Salad Salad", reason: "Quick high protein salad option.", calories: 350, protein: 30, carbs: 10, fat: 15, servings: 2 }
          ]
        };
      }

      const prompt = `You are a personalized meal-planning assistant. The user wants to swap out their current ${mealType} which is:
${JSON.stringify(currentMeal, null, 2)}

Provide 3 healthy alternative options that satisfy the household preferences, dietary goals, and strictly avoid all specified allergies:
${JSON.stringify(preferencesContext, null, 2)}

Return the alternatives strictly as valid JSON structure matching:
{
  "options": [
    { "title": "alternative recipe title", "reason": "why this matches preferences", "calories": 450, "protein": 30, "carbs": 45, "fat": 14, "servings": 2 },
    ...
  ]
}`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              options: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    reason: { type: "STRING" },
                    calories: { type: "NUMBER" },
                    protein: { type: "NUMBER" },
                    carbs: { type: "NUMBER" },
                    fat: { type: "NUMBER" },
                    servings: { type: "NUMBER" }
                  },
                  required: ["title", "reason", "calories", "protein", "carbs", "fat", "servings"]
                }
              }
            },
            required: ["options"]
          }
        }
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      logger.error("GeminiAIService swap error, returning fallback alternatives:", error);
      return {
        options: [
          { title: "Grilled Chicken Salad", reason: "Healthy high protein swap option.", calories: 400, protein: 35, carbs: 15, fat: 18, servings: 2 },
          { title: "Paneer Butter Wrap", reason: "Balanced vegetarian alternative option.", calories: 500, protein: 18, carbs: 45, fat: 22, servings: 2 },
          { title: "Tuna Salad Salad", reason: "Quick high protein salad option.", calories: 350, protein: 30, carbs: 10, fat: 15, servings: 2 }
        ]
      };
    }
  }

  async classifyRequest(userPrompt: string): Promise<boolean> {
    try {
      const promptLower = userPrompt.toLowerCase().trim();

      // FLOW C: User's saved recipe questions
      const isUserRecipeSavedQuery = 
        promptLower.includes("which of my") ||
        promptLower.includes("what recipes have i") ||
        promptLower.includes("show my saved") ||
        promptLower.includes("recipes i have saved") ||
        promptLower.includes("saved recipes") ||
        promptLower.includes("my recipes");

      if (isUserRecipeSavedQuery) {
        logger.info(`Classified user request locally: "${userPrompt}" -> QUESTION (User Saved Recipe Query)`);
        return false;
      }

      // Techniques/General nutritional queries
      const isGeneralFoodQuestion = 
        promptLower.includes("how do i cook") ||
        promptLower.includes("substitute for") ||
        promptLower.includes("use instead of") ||
        promptLower.includes("how many calories are in") ||
        promptLower.includes("how to cook chicken properly") ||
        promptLower.includes("rice less sticky");

      if (isGeneralFoodQuestion) {
        logger.info(`Classified user request locally: "${userPrompt}" -> QUESTION (General Technique Query)`);
        return false;
      }

      // Strong Recipe Cues
      const hasRecipeCues = 
        promptLower.startsWith("recipe for") ||
        promptLower.startsWith("how to make") ||
        promptLower.startsWith("how to cook") ||
        promptLower.includes("recipe") ||
        promptLower.includes("make something with") ||
        promptLower.includes("give me a recipe") ||
        promptLower.includes("traditional tamil breakfast") ||
        promptLower.includes("authentic kerala vegetarian lunch") ||
        promptLower.includes("kerala vegetarian lunch") ||
        promptLower.includes("authentic italian pasta") ||
        promptLower.includes("mexican vegetarian dinner") ||
        promptLower.includes("punjabi rajma") ||
        promptLower.includes("japanese ramen") ||
        promptLower.includes("shawarma") ||
        promptLower.includes("biryani") ||
        promptLower.includes("pasta") ||
        promptLower.includes("pizza") ||
        promptLower.includes("curry") ||
        promptLower.includes("salad") ||
        promptLower.includes("ramen") ||
        promptLower.includes("rajma") ||
        promptLower.includes("chilla") ||
        promptLower.endsWith("lunch") ||
        promptLower.endsWith("dinner") ||
        promptLower.endsWith("breakfast") ||
        promptLower.endsWith("dessert") ||
        promptLower.endsWith("snack") ||
        promptLower === "shawarma" ||
        promptLower === "pasta" ||
        promptLower === "ramen" ||
        promptLower === "pizza" ||
        promptLower === "biryani";

      if (hasRecipeCues) {
        logger.info(`Classified user request locally: "${userPrompt}" -> RECIPE_GENERATION`);
        return true;
      }

      if (!this.hasApiKey()) {
        return false;
      }

      const classificationPrompt = `You are a text classification assistant for NutriVerse.
Classify the user's intent into one of two categories: "RECIPE_GENERATION" or "QUESTION".

Guidelines for "RECIPE_GENERATION":
- If the user asks for a recipe, meal, dinner, lunch, breakfast, snack, or dessert.
- If the user names a specific dish, cuisine, or food (e.g. "shawarma", "pasta", "pizza", "chicken biryani", "Kerala vegetarian lunch", "Mexican vegetarian dinner", "Traditional Tamil breakfast").
- Even if it's a single word representing a dish or food (e.g. "SHAWARMA", "pasta", "ramen"), classify as "RECIPE_GENERATION".
- If they ask "how to make [dish]" or "how to cook [dish]", classify as "RECIPE_GENERATION".

Guidelines for "QUESTION":
- If the user asks a general culinary concept question, technique, or nutrition info (e.g. "What can I substitute for butter?", "How do I cook chicken properly?", "How can I make rice less sticky?", "How many calories are in chicken?").
- If the user asks a question about their OWN saved library of recipes (e.g. "Which of my recipes has the most protein?", "Show my saved chicken recipes", "What recipes have I saved?").

User Prompt: "${userPrompt}"

Reply with exactly "RECIPE_GENERATION" or "QUESTION". Do not include any other words.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: classificationPrompt,
      });

      const reply = response.text?.trim().toUpperCase() || "";
      logger.info(`Classified user request via Gemini: "${userPrompt}" -> ${reply}`);
      return reply.includes("RECIPE_GENERATION");
    } catch (err) {
      logger.error("Error classifying request:", err);
      // Fail-safe keyword fallback
      const keywords = ["create", "generate", "make", "recipe", "cook", "prepare", "dinner", "breakfast", "lunch", "dessert", "biryani", "pasta", "shawarma", "pizza", "curry", "salad", "ramen", "rajma"];
      return keywords.some(k => userPrompt.toLowerCase().includes(k));
    }
  }

  async generateRecipeFromPrompt(
    userPrompt: string,
    preferences: any,
    recipesContext: any
  ): Promise<any> {
    try {
      logger.info(`GeminiAIService: Generating recipe for prompt: "${userPrompt}"`);
      
      const systemInstruction = `You are NutriVerse AI, an expert global culinary assistant and recipe generator owned by Marwan Shafi.

You are NOT restricted to the user's saved recipe library.

You can generate recipes from cuisines, cultures, ingredients and cooking styles from around the world using your general culinary knowledge.

When the user asks for a recipe, meal, dish, cuisine, breakfast, lunch, dinner, snack, dessert, or asks how to make a named dish, generate a complete recipe.

The user's recipe library is optional context only.

Never say that a recipe cannot be generated because it is not present in the user's saved recipes.

Respect the user's dietary preferences, allergies, restrictions, available ingredients, calorie requirements, macro requirements, serving size, cooking time and other requirements.

If the user asks for an authentic or traditional cuisine, provide a culturally appropriate recipe rather than saying the recipe is unavailable.

Return structured JSON when the request is a recipe-generation request.

CRITICAL INSTRUCTIONS:
1. Try to satisfy ALL requirements (allergies, target macros, calories, ingredients, cooking time).
2. If the requirements are realistic, fulfill them exactly.
3. If targets conflict (e.g. "100 calorie chicken biryani with 50g protein"), explain the conflict briefly in the "conflictResolution" field, and optimize the macros/recipe to be as close to the target as practical.
4. You must only return JSON. Do not return any extra characters outside of the JSON block.`;

      const prompt = `Generate a recipe matching user request: "${userPrompt}"`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              category: { type: "STRING" },
              mealType: { type: "STRING" },
              cuisine: { type: "STRING" },
              servings: { type: "NUMBER" },
              prepTime: { type: "NUMBER" },
              cookTime: { type: "NUMBER" },
              ingredients: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    quantity: { type: "NUMBER" },
                    unit: { type: "STRING" }
                  },
                  required: ["name", "quantity", "unit"]
                }
              },
              instructions: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              dietaryTags: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              difficulty: { type: "STRING" },
              tips: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              conflictResolution: { type: "STRING" }
            },
            required: [
              "title",
              "description",
              "category",
              "mealType",
              "cuisine",
              "servings",
              "prepTime",
              "cookTime",
              "ingredients",
              "instructions",
              "dietaryTags",
              "difficulty",
              "tips"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      const parsed = JSON.parse(responseText);
      const validated = generatedRecipeSchema.parse(parsed);
      return validated;
    } catch (error: any) {
      logger.error("Error in generateRecipeFromPrompt:", error);
      throw error;
    }
  }
}
