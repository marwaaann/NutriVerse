import { RecipeModel } from "../models/recipe_model";
import { FoodDataClient } from "../services/food_data_client";
import { GeminiAIService } from "../services/gemini_ai_service";
import NutritionService from "../services/nutrition_service";
import logger from "../config/logger";

const foodDataClient = new FoodDataClient();
const aiService = new GeminiAIService();
const nutritionService = new NutritionService(foodDataClient, aiService);

export const migrateMissingNutrition = async (): Promise<void> => {
  try {
    logger.info("Starting nutrition migration check for existing zero-calorie recipes...");
    const recipes = await RecipeModel.find({});

    for (const doc of recipes) {
      const needsRecalculation = 
        !doc.nutrition || 
        doc.nutrition.calories === 0 || 
        !doc.caloriesPerServing ||
        doc.caloriesPerServing === 0;

      if (needsRecalculation) {
        logger.info(`Recalculating nutrition stats for recipe: "${doc.title}" (ID: ${doc._id})`);
        try {
          // Normalize and calculate macros using local fallbacks
          const nutrition = await nutritionService.analyzeRecipeIngredients(doc.ingredients);
          const perServingNutrition = await nutritionService.calculatePerServing(nutrition, doc.servings);

          await RecipeModel.updateOne(
            { _id: doc._id },
            {
              $set: {
                nutrition,
                caloriesPerServing: perServingNutrition.calories,
                proteinPerServing: perServingNutrition.protein,
                carbohydratesPerServing: perServingNutrition.carbohydrates,
                fatPerServing: perServingNutrition.fat,
              }
            }
          );
          logger.info(`Successfully updated nutrition stats for recipe: "${doc.title}"`);
        } catch (error) {
          logger.error(`Failed to recalculate nutrition stats for "${doc.title}":`, error);
        }
      }
    }
    logger.info("Nutrition migration completed.");
  } catch (error) {
    logger.error("Error during nutrition migration:", error);
  }
};
