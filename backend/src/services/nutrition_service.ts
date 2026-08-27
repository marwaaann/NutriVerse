import { INutritionService, INutrition, INutritionPerServing } from "../interface/INutritionService";
import { IFoodDataClient } from "../interface/IFoodDataClient";
import { IAIService } from "../interface/IAIService";
import { AppError } from "../utils/AppError";
import logger from "../config/logger";

class NutritionService implements INutritionService {
  constructor(
    private foodDataClient: IFoodDataClient,
    private aiService: IAIService
  ) {}

  async analyzeRecipeIngredients(
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      normalizedName?: string;
      calories?: number;
      protein?: number;
      carbohydrates?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    }>
  ): Promise<INutrition> {
    try {
      logger.debug("NutritionService: Analyzing ingredients");

      // Batch normalize ingredients in a single Gemini API request
      const ingredientStrings = ingredients.map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`);
      const ingredientsBlock = ingredientStrings.join("\n");
      
      let normalizedIngredientsMap: Record<number, { name: string; quantity: number; unit: string }> = {};

      try {
        logger.info("NutritionService: Batch normalizing ingredients list via Gemini...");
        const normalizedList = await this.aiService.normalizeIngredients(ingredientsBlock);
        
        for (let i = 0; i < ingredients.length; i++) {
          // Attempt to match by index position from Gemini response list
          const matched = normalizedList[i];
          if (matched) {
            normalizedIngredientsMap[i] = matched;
          }
        }
      } catch (err) {
        logger.warn("Could not batch normalize ingredients via AI:", err);
      }

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalSugar = 0;
      let totalSodium = 0;

      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        let name = ingredient.name;
        let quantity = ingredient.quantity;
        let unit = ingredient.unit;

        // Apply batch normalization details if matched successfully
        const normalized = normalizedIngredientsMap[i];
        if (normalized) {
          name = normalized.name || name;
          if (normalized.quantity) quantity = normalized.quantity;
          if (normalized.unit) unit = normalized.unit;
        }

        ingredient.normalizedName = name;
        ingredient.quantity = quantity;
        ingredient.unit = unit;

        const nutrition = await this.fetchIngredientNutrition(
          name,
          quantity,
          unit
        );

        if (nutrition) {
          ingredient.calories = Math.round(nutrition.calories);
          ingredient.protein = Math.round(nutrition.protein * 10) / 10;
          ingredient.carbohydrates = Math.round(nutrition.carbohydrates * 10) / 10;
          ingredient.fat = Math.round(nutrition.fat * 10) / 10;
          ingredient.fiber = Math.round((nutrition.fiber || 0) * 10) / 10;
          ingredient.sugar = Math.round((nutrition.sugar || 0) * 10) / 10;
          ingredient.sodium = Math.round(nutrition.sodium || 0);

          totalCalories += nutrition.calories;
          totalProtein += nutrition.protein;
          totalCarbs += nutrition.carbohydrates;
          totalFat += nutrition.fat;
          totalFiber += nutrition.fiber || 0;
          totalSugar += nutrition.sugar || 0;
          totalSodium += nutrition.sodium || 0;
        }
      }

      return {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        carbohydrates: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
        sugar: Math.round(totalSugar * 10) / 10,
        sodium: Math.round(totalSodium),
      };
    } catch (error) {
      logger.error("Error analyzing ingredients:", error);
      throw new AppError("Failed to analyze ingredients", 500);
    }
  }

  async fetchIngredientNutrition(
    ingredientName: string,
    quantity: number,
    unit: string
  ): Promise<INutrition | null> {
    try {
      logger.debug(`NutritionService: Fetching nutrition for ${ingredientName}`);
      
      const nutrition = await this.foodDataClient.getNutritionData(
        ingredientName,
        quantity,
        unit
      );

      return nutrition;
    } catch (error) {
      logger.warn(`Could not fetch nutrition for ${ingredientName}:`, error);
      return null;
    }
  }

  async calculatePerServing(
    totalNutrition: INutrition,
    servings: number
  ): Promise<INutritionPerServing> {
    try {
      if (servings <= 0) {
        throw new AppError("Servings must be greater than 0", 400);
      }

      return {
        calories: Math.round(totalNutrition.calories / servings),
        protein: Math.round((totalNutrition.protein / servings) * 10) / 10,
        carbohydrates: Math.round((totalNutrition.carbohydrates / servings) * 10) / 10,
        fat: Math.round((totalNutrition.fat / servings) * 10) / 10,
        fiber: totalNutrition.fiber ? Math.round((totalNutrition.fiber / servings) * 10) / 10 : 0,
        sugar: totalNutrition.sugar ? Math.round((totalNutrition.sugar / servings) * 10) / 10 : 0,
        sodium: totalNutrition.sodium ? Math.round(totalNutrition.sodium / servings) : 0,
        servingSize: servings,
      };
    } catch (error) {
      logger.error("Error calculating per-serving nutrition:", error);
      throw new AppError("Failed to calculate nutrition per serving", 500);
    }
  }

  async normalizeIngredient(
    ingredientName: string
  ): Promise<{
    normalizedName: string;
    quantity?: number;
    unit?: string;
  }> {
    try {
      const normalizedList = await this.aiService.normalizeIngredients(ingredientName);
      if (normalizedList && normalizedList.length > 0) {
        return {
          normalizedName: normalizedList[0].name,
          quantity: normalizedList[0].quantity,
          unit: normalizedList[0].unit,
        };
      }
      return {
        normalizedName: ingredientName.toLowerCase().trim(),
      };
    } catch (error) {
      logger.error("Error normalizing ingredient:", error);
      return {
        normalizedName: ingredientName.toLowerCase().trim(),
      };
    }
  }
}

export default NutritionService;
