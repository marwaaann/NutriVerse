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

      const prompt = `You are an expert culinary chef and context-aware nutrition assistant for NutriVerse.
Answer the user's question with detailed, accurate, appetizing, and helpful culinary and nutrition information.

CRITICAL GUIDELINES:
1. If the user asks about a specific dish or recipe (e.g. "Tell me about the recipe for Kerala Style Chicken Curry with Matta Rice"):
   - Provide a complete, structured recipe description.
   - List the essential ingredients with recommended quantities.
   - Provide step-by-step cooking & preparation instructions.
   - Mention prep time, cooking time, servings, and estimated nutrition breakdown (Calories, Protein, Carbs, Fat).
2. If stored recipe data is present in the context, prioritize it.
3. If the dish is NOT stored in the context, provide authentic, traditional culinary recipe knowledge for that dish. Do NOT say you do not have enough information!
4. Format your response cleanly using markdown (bold headings, bullet points).

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

  private getFallbackMealPlan(dateStr: string, preferencesContext?: Record<string, any>): any {
    const date = new Date(dateStr);
    const day = isNaN(date.getTime()) ? 0 : date.getDay(); // 0 is Sunday, 6 is Saturday

    const cuisines: string[] = preferencesContext?.userPreferences?.cuisines || [];
    const isKeralaOrIndian = cuisines.length === 0 || cuisines.some(c => /kerala|indian|south indian/i.test(c));

    if (isKeralaOrIndian) {
      const keralaPlans = [
        // 0: Sunday
        {
          breakfast: { title: "Kerala Egg Roast with Appam", reason: "Traditional Sunday breakfast with spiced eggs and fluffy fermented rice appam.", calories: 380, protein: 18, carbs: 42, fat: 14, servings: 2 },
          lunch: { title: "Kerala Style Chicken Curry with Matta Rice", reason: "Authentic homestyle coconut chicken curry with hearty Kerala Matta rice.", calories: 550, protein: 42, carbs: 58, fat: 16, servings: 2 },
          snack: { title: "Pazham Pori (Banana Fritters)", reason: "Crisp and naturally sweet classic Kerala tea-time treat.", calories: 160, protein: 2, carbs: 32, fat: 4, servings: 2 },
          dinner: { title: "Kozhi Nirachathu with Wheat Roti", reason: "High-protein Malabar roasted chicken preparation paired with fiber-rich roti.", calories: 520, protein: 38, carbs: 46, fat: 15, servings: 2 }
        },
        // 1: Monday
        {
          breakfast: { title: "Steamed Puttu with Kadala Curry", reason: "Wholesome fiber and protein combination of black chickpeas and steamed rice cylinders.", calories: 360, protein: 16, carbs: 62, fat: 6, servings: 2 },
          lunch: { title: "Kerala Fish Curry with Rice & Aviyal", reason: "Tangy Kudampuli fish curry with steamed rice and mixed vegetable aviyal.", calories: 520, protein: 36, carbs: 55, fat: 14, servings: 2 },
          snack: { title: "Boiled Egg Chaat with Mint & Pepper", reason: "Quick protein booster snack with refreshing garden mint.", calories: 140, protein: 12, carbs: 4, fat: 9, servings: 2 },
          dinner: { title: "Light Kerala Chicken Stew with Chapati", reason: "Gentle coconut-milk chicken stew with fresh steamed carrots and beans.", calories: 440, protein: 32, carbs: 44, fat: 12, servings: 2 }
        },
        // 2: Tuesday
        {
          breakfast: { title: "Masala Dosa with Sambar & Coconut Chutney", reason: "Fermented crispy crepe filled with spiced potato masala.", calories: 330, protein: 9, carbs: 54, fat: 10, servings: 2 },
          lunch: { title: "Malabar Chicken Biryani with Raita", reason: "Fragrant short-grain Khaima rice chicken biryani with chilled onion raita.", calories: 620, protein: 40, carbs: 68, fat: 18, servings: 2 },
          snack: { title: "Spiced Roasted Makhana & Chana", reason: "Crunchy low-glycemic roasted snack packed with minerals.", calories: 150, protein: 7, carbs: 22, fat: 4, servings: 2 },
          dinner: { title: "Kerala Egg Masala with Phulka & Dal", reason: "Rich roasted egg gravy served with soft phulkas and yellow lentils.", calories: 420, protein: 22, carbs: 48, fat: 12, servings: 2 }
        },
        // 3: Wednesday
        {
          breakfast: { title: "Steamed Idli with Sambar & Tomato Chutney", reason: "Steamed and fermented easily-digestible South Indian breakfast staple.", calories: 280, protein: 8, carbs: 52, fat: 3, servings: 2 },
          lunch: { title: "Pepper Chicken Roast with Whole Wheat Parotta", reason: "Black pepper roasted chicken with flaky layered wheat bread.", calories: 570, protein: 44, carbs: 50, fat: 16, servings: 2 },
          snack: { title: "Fresh Fruit Salad with Chaat Masala", reason: "Hydrating seasonal fruit platter sprinkled with tangy chaat spices.", calories: 130, protein: 2, carbs: 30, fat: 1, servings: 2 },
          dinner: { title: "Fish Moilee with Steamed Rice", reason: "Mildly spiced coconut milk fish curry with aromatic curry leaves.", calories: 460, protein: 34, carbs: 50, fat: 11, servings: 2 }
        },
        // 4: Thursday
        {
          breakfast: { title: "Speedy Spinach and Feta Scrambled Eggs", reason: "Iron and protein rich quick morning scramble with whole grain toast.", calories: 340, protein: 20, carbs: 22, fat: 18, servings: 2 },
          lunch: { title: "Authentic Kerala Vegetarian Sadya Lunch", reason: "Complete traditional feast: Matta rice, sambar, thoran, and papadam.", calories: 510, protein: 15, carbs: 82, fat: 10, servings: 2 },
          snack: { title: "Cucumber & Carrot Sticks with Peanut Dip", reason: "Crisp raw vegetables with savory protein dip.", calories: 120, protein: 4, carbs: 12, fat: 7, servings: 2 },
          dinner: { title: "Lemon Herb Grilled Chicken with Roasted Asparagus", reason: "Lean chicken breast seasoned with zesty herbs and roasted greens.", calories: 470, protein: 42, carbs: 24, fat: 14, servings: 2 }
        },
        // 5: Friday
        {
          breakfast: { title: "Thattukada Style Egg Dosa with Chutney", reason: "Popular street-style egg-topped crispy dosa with red chili chutney.", calories: 350, protein: 16, carbs: 46, fat: 12, servings: 2 },
          lunch: { title: "Kerala Chicken Mappas with Rice", reason: "Rich coriander and coconut milk chicken curry served with steamed rice.", calories: 540, protein: 38, carbs: 56, fat: 15, servings: 2 },
          snack: { title: "Roasted Cashews & Raisins", reason: "Heart-healthy fats and natural energy booster.", calories: 180, protein: 5, carbs: 16, fat: 12, servings: 2 },
          dinner: { title: "Grilled Fish Tikka with Stir-fried Beans", reason: "Omega-3 rich fish fillets grilled with green beans and roti.", calories: 430, protein: 36, carbs: 32, fat: 11, servings: 2 }
        },
        // 6: Saturday
        {
          breakfast: { title: "Kerala Mutta Porichathu (Egg Bhurji) & Toast", reason: "Quick scrambled eggs with onions, green chilies, and curry leaves.", calories: 330, protein: 18, carbs: 30, fat: 14, servings: 2 },
          lunch: { title: "Malabar Chicken Ghee Rice with Pickle & Raita", reason: "Aromatic spiced ghee rice paired with succulent chicken curry.", calories: 630, protein: 38, carbs: 70, fat: 20, servings: 2 },
          snack: { title: "Spiced Roasted Corn on the Cob", reason: "Smoky sweet corn basted with lime and chili powder.", calories: 150, protein: 4, carbs: 30, fat: 2, servings: 2 },
          dinner: { title: "Chicken Tikka with Mint Chutney & Phulka", reason: "Tandoori seasoned lean chicken with whole wheat bread.", calories: 490, protein: 40, carbs: 42, fat: 12, servings: 2 }
        }
      ];
      return keralaPlans[day] || keralaPlans[0];
    }

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
    dateStr?: string,
    avoidDishes?: string[]
  ): Promise<any> {
    try {
      logger.debug("GeminiAIService: Generating structured meal plan");

      if (!this.hasApiKey()) {
        logger.info("GeminiAIService fallback: returning pre-defined meal plan");
        return this.getFallbackMealPlan(dateStr || "", preferencesContext);
      }

      const avoidListStr = avoidDishes && avoidDishes.length > 0
        ? `\nCRITICAL VARIETY CONSTRAINT: DO NOT repeat any of the following dishes already served on other days of the week: ${avoidDishes.join(", ")}.\n`
        : "";

      const userBmiCategory = preferencesContext.userPreferences?.bmiCategory || "";
      const userGoal = preferencesContext.userPreferences?.healthGoals?.[0] || "";
      const calorieTarget = preferencesContext.userPreferences?.dailyCalorieTarget || "";

      const healthGuidelines = userBmiCategory ? `
HEALTH & BMI TARGET GUIDELINES:
- User BMI Category: ${userBmiCategory} (Daily Target: ~${calorieTarget} kcal/day).
- Main Goal: ${userGoal}.
- IF UNDERWEIGHT: Prioritize nutrient-dense and protein-rich foods, healthy fats, and healthy caloric density.
- IF NORMAL WEIGHT: Provide balanced macronutrients, sustained energy, and whole foods.
- IF OVERWEIGHT / OBESE: Emphasize generous vegetables, lean proteins, high-fiber foods, and appropriate portion sizes. Avoid extreme calorie restriction.
- SAFETY RULE: Never prescribe dangerous crash diets or extreme deficits.
` : "";

      const prompt = `You are a personalized meal-planning assistant for a household. Build a full-day meal plan (Breakfast, Lunch, Snack, Dinner) for date "${dateStr || 'today'}".
Preferences and constraints:
${JSON.stringify(preferencesContext, null, 2)}
${healthGuidelines}
${avoidListStr}
Available recipe collection context:
${JSON.stringify(availableRecipes.map(r => ({
  id: r._id,
  title: r.title,
  category: r.category,
  cookingTime: r.cookingTime,
  servings: r.servings,
  nutrition: r.nutrition || {}
})), null, 2)}

CRITICAL REQUIREMENTS:
1. STRICTLY satisfy all allergies listed in the preferences (MUST NOT contain any ingredients that the user is allergic to).
2. DIVERSITY & NON-REPETITION: Every day of the week must have completely different, delicious varieties matching the user's cuisine preference (${JSON.stringify(preferencesContext.userPreferences?.cuisines || [])}) and non-veg preferences (${JSON.stringify(preferencesContext.userPreferences?.nonVegPreference || [])}).
3. NUTRITIONAL TARGET: Aligns with the user's BMI category (${userBmiCategory || 'healthy'}) and target calories (~${calorieTarget || '2000'} kcal/day).
4. Choose recipes from the available recipe collection when appropriate. If no suitable recipe is in the collection or to ensure variety, suggest a new recipe with a title, default servings, estimated calories, protein, carbs, fat, and a "reason" matching the user's cuisine/preference.
5. Return the response strictly as valid JSON structure matching:
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

      // Informational Q&A (e.g. "Tell me about the recipe for...", "What is...", "Describe...")
      const isInformationalQuery = 
        promptLower.startsWith("tell me about") ||
        promptLower.startsWith("tell me") ||
        promptLower.startsWith("what is") ||
        promptLower.startsWith("explain") ||
        promptLower.startsWith("describe") ||
        promptLower.startsWith("can you tell me") ||
        promptLower.includes("tell me about") ||
        promptLower.includes("what are the ingredients");

      if (isInformationalQuery) {
        logger.info(`Classified user request locally: "${userPrompt}" -> QUESTION (Informational Q&A)`);
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

  async generateIngredientsForDishes(
    dishTitles: string[]
  ): Promise<Array<{ name: string; quantity: number; unit: string; category: string }>> {
    try {
      if (!this.hasApiKey() || dishTitles.length === 0) {
        return this.getFallbackIngredientsForDishes(dishTitles);
      }

      const prompt = `You are a grocery list assistant. The user wants to buy all raw grocery ingredients needed to cook these meal dishes:
${dishTitles.map(t => `- ${t}`).join("\n")}

Return a comprehensive consolidated list of raw ingredients needed with realistic quantities for 2 servings each. Combine overlapping ingredients.
Return strictly valid JSON matching this schema:
{
  "items": [
    { "name": "ingredient name", "quantity": 2, "unit": "pcs", "category": "Produce" }
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
              items: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    quantity: { type: "NUMBER" },
                    unit: { type: "STRING" },
                    category: { type: "STRING" }
                  },
                  required: ["name", "quantity", "unit", "category"]
                }
              }
            },
            required: ["items"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed.items;
      }
      return this.getFallbackIngredientsForDishes(dishTitles);
    } catch (error) {
      logger.error("GeminiAIService error in generateIngredientsForDishes:", error);
      return this.getFallbackIngredientsForDishes(dishTitles);
    }
  }

  private getFallbackIngredientsForDishes(
    dishTitles: string[]
  ): Array<{ name: string; quantity: number; unit: string; category: string }> {
    const itemsMap = new Map<string, { name: string; quantity: number; unit: string; category: string }>();

    const add = (name: string, quantity: number, unit: string, category: string) => {
      const key = name.toLowerCase().trim();
      if (itemsMap.has(key)) {
        itemsMap.get(key)!.quantity += quantity;
      } else {
        itemsMap.set(key, { name, quantity, unit, category });
      }
    };

    for (const title of dishTitles) {
      const t = title.toLowerCase();
      if (t.includes("egg")) {
        add("Fresh Eggs", 4, "pcs", "Dairy & Eggs");
        add("Onions", 2, "pcs", "Produce");
        add("Tomatoes", 2, "pcs", "Produce");
        add("Green Chilies", 2, "pcs", "Produce");
        add("Curry Leaves", 1, "bunch", "Produce");
        add("Coconut Oil", 2, "tbsp", "Pantry");
      }
      if (t.includes("appam")) {
        add("Rice Flour / Appam Batter", 500, "g", "Pantry");
        add("Coconut Milk", 200, "ml", "Pantry");
      }
      if (t.includes("chicken")) {
        add("Fresh Chicken", 500, "g", "Meat & Seafood");
        add("Ginger-Garlic Paste", 2, "tbsp", "Pantry");
        add("Garam Masala Powder", 1, "tbsp", "Spices");
        add("Turmeric Powder", 1, "tsp", "Spices");
        add("Chili Powder", 1, "tbsp", "Spices");
        add("Coriander Powder", 1, "tbsp", "Spices");
      }
      if (t.includes("matta") || t.includes("rice")) {
        add("Kerala Matta Rice", 500, "g", "Grains & Pasta");
      }
      if (t.includes("biryani")) {
        add("Basmati / Khaima Rice", 500, "g", "Grains & Pasta");
        add("Yogurt / Curd", 200, "g", "Dairy & Eggs");
        add("Mint Leaves", 1, "bunch", "Produce");
        add("Biryani Masala", 2, "tbsp", "Spices");
      }
      if (t.includes("fish")) {
        add("Fresh Fish Steaks", 400, "g", "Meat & Seafood");
        add("Kudampuli (Cocum)", 3, "pcs", "Pantry");
        add("Fenugreek Seeds", 1, "tsp", "Spices");
      }
      if (t.includes("puttu") || t.includes("kadala")) {
        add("Puttu Podi (Rice Flour)", 400, "g", "Pantry");
        add("Grated Coconut", 1, "cup", "Produce");
        add("Black Chickpeas (Kadala)", 250, "g", "Pantry");
      }
      if (t.includes("dosa") || t.includes("idli")) {
        add("Idli/Dosa Batter", 1, "kg", "Pantry");
        add("Sambar Vegetables (Drumstick, Carrot)", 300, "g", "Produce");
        add("Toor Dal", 150, "g", "Pantry");
      }
      if (t.includes("spinach")) {
        add("Fresh Spinach", 200, "g", "Produce");
        add("Feta Cheese", 100, "g", "Dairy & Eggs");
      }
      if (t.includes("orange juice")) {
        add("Fresh Oranges", 6, "pcs", "Produce");
      }
      if (t.includes("avocado")) {
        add("Ripe Avocados", 2, "pcs", "Produce");
      }
      if (t.includes("banana")) {
        add("Nendran Bananas", 4, "pcs", "Produce");
      }

      // Base staple seasonings
      add("Salt", 1, "pack", "Pantry");
    }

    return Array.from(itemsMap.values());
  }
}
