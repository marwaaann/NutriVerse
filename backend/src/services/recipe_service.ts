import { IRecipeService, CreateRecipeInput, DashboardStats } from "../interface/IRecipeService";
import { IRecipeRepository } from "../interface/IRecipeRepository";
import { INutritionService } from "../interface/INutritionService";
import { IRecipe } from "../interface/IRecipe";
import { INutrition } from "../interface/INutritionService";
import { AppError } from "../utils/AppError";
import { INotificationService } from "../interface/INotificationService";
import logger from "../config/logger";

class RecipeService implements IRecipeService {
  constructor(
    private recipeRepository: IRecipeRepository,
    private nutritionService: INutritionService,
    private notificationService: INotificationService
  ) {}

  async createRecipe(userId: string, recipeData: CreateRecipeInput): Promise<IRecipe> {
    try {
      // Analyze and calculate nutrition
      const nutrition = await this.nutritionService.analyzeRecipeIngredients(
        recipeData.ingredients
      );

      // Calculate per-serving nutrition
      const perServingNutrition = await this.nutritionService.calculatePerServing(
        nutrition,
        recipeData.servings
      );

      // Create recipe with nutrition data
      const recipeToCreate: Partial<IRecipe> = {
        ...recipeData,
        authorId: userId,
        nutrition,
        caloriesPerServing: perServingNutrition.calories,
        proteinPerServing: perServingNutrition.protein,
        carbohydratesPerServing: perServingNutrition.carbohydrates,
        fatPerServing: perServingNutrition.fat,
      };

      const recipe = await this.recipeRepository.create(recipeToCreate);
      await this.notificationService.createNotification(
        userId,
        "Recipe Created",
        "Recipe Created",
        `${recipe.title} was successfully added.`,
        recipe._id
      );
      return recipe;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create recipe", 500);
    }
  }

  async getRecipe(id: string): Promise<IRecipe | null> {
    try {
      const recipe = await this.recipeRepository.findById(id);
      if (!recipe) {
        throw new AppError("Recipe not found", 404);
      }
      return recipe;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to fetch recipe", 500);
    }
  }

  async updateRecipe(id: string, userId: string, recipeData: Partial<CreateRecipeInput>): Promise<IRecipe | null> {
    try {
      // Verify ownership
      const existingRecipe = await this.recipeRepository.findById(id);
      if (!existingRecipe) {
        throw new AppError("Recipe not found", 404);
      }
      if (existingRecipe.authorId !== userId) {
        throw new AppError("Unauthorized to update this recipe", 403);
      }

      // If ingredients changed, recalculate nutrition
      if (recipeData.ingredients) {
        const nutrition = await this.nutritionService.analyzeRecipeIngredients(
          recipeData.ingredients
        );

        const servings = recipeData.servings || existingRecipe.servings;
        const perServingNutrition = await this.nutritionService.calculatePerServing(
          nutrition,
          servings
        );

        recipeData = {
          ...recipeData,
          nutrition,
          caloriesPerServing: perServingNutrition.calories,
          proteinPerServing: perServingNutrition.protein,
          carbohydratesPerServing: perServingNutrition.carbohydrates,
          fatPerServing: perServingNutrition.fat,
        } as any;
      } else if (recipeData.servings && recipeData.servings !== existingRecipe.servings) {
        // Recalculate per-serving if servings changed
        if (existingRecipe.nutrition) {
          const perServingNutrition = await this.nutritionService.calculatePerServing(
            existingRecipe.nutrition,
            recipeData.servings
          );

          recipeData = {
            ...recipeData,
            caloriesPerServing: perServingNutrition.calories,
            proteinPerServing: perServingNutrition.protein,
            carbohydratesPerServing: perServingNutrition.carbohydrates,
            fatPerServing: perServingNutrition.fat,
          } as any;
        }
      }

      const recipe = await this.recipeRepository.update(id, recipeData);
      if (recipe) {
        await this.notificationService.createNotification(
          userId,
          "Recipe Updated",
          "Recipe Updated",
          `${recipe.title} was updated successfully.`,
          recipe._id
        );
      }
      return recipe;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update recipe", 500);
    }
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    try {
      const existingRecipe = await this.recipeRepository.findById(id);
      if (!existingRecipe) {
        throw new AppError("Recipe not found", 404);
      }

      const result = await this.recipeRepository.delete(id);
      if (result) {
        try {
          await this.notificationService.createNotification(
            userId,
            "Recipe Deleted",
            "Recipe Deleted",
            `${existingRecipe.title} was deleted.`,
            id
          );
        } catch (notifError) {
          logger.warn("Failed to create recipe deletion notification:", notifError);
        }
      }
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete recipe", 500);
    }
  }

  async getUserRecipes(userId: string, limit: number = 10, offset: number = 0): Promise<IRecipe[]> {
    try {
      return await this.recipeRepository.findByAuthorId(userId, limit, offset);
    } catch (error) {
      throw new AppError("Failed to fetch user recipes", 500);
    }
  }

  async getAllRecipes(limit: number = 20, offset: number = 0): Promise<IRecipe[]> {
    try {
      return await this.recipeRepository.findAll(limit, offset);
    } catch (error) {
      throw new AppError("Failed to fetch recipes", 500);
    }
  }

  async analyzeAndCalculateNutrition(recipe: Partial<IRecipe>): Promise<INutrition> {
    try {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        throw new AppError("No ingredients provided", 400);
      }

      return await this.nutritionService.analyzeRecipeIngredients(recipe.ingredients);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to analyze nutrition", 500);
    }
  }

  async getRecipeNutrition(id: string): Promise<INutrition | null> {
    try {
      const recipe = await this.recipeRepository.findById(id);
      if (!recipe) {
        throw new AppError("Recipe not found", 404);
      }
      return recipe.nutrition || null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to fetch recipe nutrition", 500);
    }
  }

  async analyzeRecipeNutritionAndSave(id: string, userId: string): Promise<IRecipe> {
    try {
      const recipe = await this.recipeRepository.findById(id);
      if (!recipe) {
        throw new AppError("Recipe not found", 404);
      }
      if (recipe.authorId !== userId) {
        throw new AppError("Unauthorized to analyze this recipe", 403);
      }

      const nutrition = await this.analyzeAndCalculateNutrition(recipe);
      const perServingNutrition = await this.nutritionService.calculatePerServing(
        nutrition,
        recipe.servings
      );

      const updatedRecipe = await this.recipeRepository.update(id, {
        nutrition,
        caloriesPerServing: perServingNutrition.calories,
        proteinPerServing: perServingNutrition.protein,
        carbohydratesPerServing: perServingNutrition.carbohydrates,
        fatPerServing: perServingNutrition.fat,
      });

      if (!updatedRecipe) {
        throw new AppError("Failed to update recipe nutrition", 500);
      }

      return updatedRecipe;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to analyze and save nutrition", 500);
    }
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const userRecipes = await this.recipeRepository.findByAuthorId(userId, 100, 0);
      const totalRecipes = userRecipes.length;
      
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      const recentRecipes = userRecipes.slice(0, 5);

      userRecipes.forEach(recipe => {
        if (recipe.nutrition) {
          totalCalories += recipe.nutrition.calories || 0;
          totalProtein += recipe.nutrition.protein || 0;
          totalCarbs += recipe.nutrition.carbohydrates || 0;
          totalFat += recipe.nutrition.fat || 0;
        }
      });

      const averageCalories = totalRecipes > 0 ? totalCalories / totalRecipes : 0;
      const averageProtein = totalRecipes > 0 ? totalProtein / totalRecipes : 0;
      const averageCarbs = totalRecipes > 0 ? totalCarbs / totalRecipes : 0;
      const averageFat = totalRecipes > 0 ? totalFat / totalRecipes : 0;

      const chartRecipes = [...userRecipes].slice(0, 7).reverse();
      const chartData = {
        calories: chartRecipes.map(r => r.nutrition?.calories || 0),
        protein: chartRecipes.map(r => r.nutrition?.protein || 0),
        carbs: chartRecipes.map(r => r.nutrition?.carbohydrates || 0),
        fat: chartRecipes.map(r => r.nutrition?.fat || 0),
        labels: chartRecipes.map(r => r.title),
      };

      return {
        totalRecipes,
        totalCalories,
        averageCalories,
        averageProtein,
        averageCarbs,
        averageFat,
        recentRecipes,
        chartData,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to calculate dashboard statistics", 500);
    }
  }
}

export default RecipeService;
