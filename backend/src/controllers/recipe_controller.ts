import { NextFunction, Request, Response } from "express";
import { IRecipeService } from "../interface/IRecipeService";
import { IChatService } from "../interface/IChatService";
import { apiResponse } from "../helpers/apiResponse";
import logger from "../config/logger";
import { RecipeResponseDTO, NutritionResponseDTO } from "../dtos/recipe.dto";
import { AppError } from "../utils/AppError";
import { CreateRecipeInput, UpdateRecipeInput } from "../validators/recipeValidation";
import { cloudinaryService } from "../services/cloudinary_service";

export class RecipeController {
  constructor(
    private recipeService: IRecipeService,
    private chatService: IChatService
  ) {}

  createRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.debug("RecipeController: Creating new recipe");

      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const recipeData: CreateRecipeInput = req.body;

      const recipe = await this.recipeService.createRecipe(userId, recipeData);

      apiResponse<RecipeResponseDTO>(
        res,
        201,
        true,
        "Recipe created successfully",
        recipe as RecipeResponseDTO
      );
    } catch (error) {
      logger.error("Error creating recipe:", error);
      next(error);
    }
  };

  getRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      logger.debug(`RecipeController: Fetching recipe ${id}`);

      const recipe = await this.recipeService.getRecipe(id);

      apiResponse<RecipeResponseDTO>(
        res,
        200,
        true,
        "Recipe fetched successfully",
        recipe as RecipeResponseDTO
      );
    } catch (error) {
      logger.error("Error fetching recipe:", error);
      next(error);
    }
  };

  updateRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      logger.debug(`RecipeController: Updating recipe ${id}`);

      const recipeData: UpdateRecipeInput = req.body;
      const updatedRecipe = await this.recipeService.updateRecipe(
        id,
        userId,
        recipeData
      );

      if (!updatedRecipe) {
        throw new AppError("Recipe not found", 404);
      }

      apiResponse<RecipeResponseDTO>(
        res,
        200,
        true,
        "Recipe updated successfully",
        updatedRecipe as RecipeResponseDTO
      );
    } catch (error) {
      logger.error("Error updating recipe:", error);
      next(error);
    }
  };

  deleteRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      logger.debug(`RecipeController: Deleting recipe ${id}`);

      const success = await this.recipeService.deleteRecipe(id, userId);

      if (!success) {
        throw new AppError("Recipe not found", 404);
      }

      apiResponse(
        res,
        200,
        true,
        "Recipe deleted successfully",
        null
      );
    } catch (error) {
      logger.error("Error deleting recipe:", error);
      next(error);
    }
  };

  getUserRecipes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const { limit = 10, offset = 0 } = req.query;

      logger.debug(`RecipeController: Fetching recipes for user ${userId}`);

      const recipes = await this.recipeService.getUserRecipes(
        userId,
        Number(limit),
        Number(offset)
      );

      apiResponse<RecipeResponseDTO[]>(
        res,
        200,
        true,
        "User recipes fetched successfully",
        recipes as RecipeResponseDTO[]
      );
    } catch (error) {
      logger.error("Error fetching user recipes:", error);
      next(error);
    }
  };

  getAllRecipes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit = 20, offset = 0 } = req.query;

      logger.debug("RecipeController: Fetching all recipes");

      const recipes = await this.recipeService.getAllRecipes(
        Number(limit),
        Number(offset)
      );

      apiResponse<RecipeResponseDTO[]>(
        res,
        200,
        true,
        "Recipes fetched successfully",
        recipes as RecipeResponseDTO[]
      );
    } catch (error) {
      logger.error("Error fetching recipes:", error);
      next(error);
    }
  };

  getRecipeNutrition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      logger.debug(`RecipeController: Fetching nutrition for recipe ${id}`);

      const recipe = await this.recipeService.getRecipe(id);
      if (!recipe) {
        throw new AppError("Recipe not found", 404);
      }

      const nutritionResponse: NutritionResponseDTO = {
        recipeId: id,
        totalNutrition: {
          calories: recipe.nutrition?.calories || 0,
          protein: recipe.nutrition?.protein || 0,
          carbohydrates: recipe.nutrition?.carbohydrates || 0,
          fat: recipe.nutrition?.fat || 0,
          fiber: recipe.nutrition?.fiber,
          sugar: recipe.nutrition?.sugar,
          sodium: recipe.nutrition?.sodium,
        },
        perServing: {
          calories: recipe.caloriesPerServing || 0,
          protein: recipe.proteinPerServing || 0,
          carbohydrates: recipe.carbohydratesPerServing || 0,
          fat: recipe.fatPerServing || 0,
        },
        servings: recipe.servings,
      };

      apiResponse<NutritionResponseDTO>(
        res,
        200,
        true,
        "Recipe nutrition fetched successfully",
        nutritionResponse
      );
    } catch (error) {
      logger.error("Error fetching recipe nutrition:", error);
      next(error);
    }
  };

  analyzeRecipeNutrition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      logger.debug(`RecipeController: Analyzing nutrition for recipe ${id}`);

      const updatedRecipe = await this.recipeService.analyzeRecipeNutritionAndSave(id, userId);

      const nutritionResponse: NutritionResponseDTO = {
        recipeId: id,
        totalNutrition: {
          calories: updatedRecipe.nutrition?.calories || 0,
          protein: updatedRecipe.nutrition?.protein || 0,
          carbohydrates: updatedRecipe.nutrition?.carbohydrates || 0,
          fat: updatedRecipe.nutrition?.fat || 0,
          fiber: updatedRecipe.nutrition?.fiber,
          sugar: updatedRecipe.nutrition?.sugar,
          sodium: updatedRecipe.nutrition?.sodium,
        },
        perServing: {
          calories: updatedRecipe.caloriesPerServing || 0,
          protein: updatedRecipe.proteinPerServing || 0,
          carbohydrates: updatedRecipe.carbohydratesPerServing || 0,
          fat: updatedRecipe.fatPerServing || 0,
        },
        servings: updatedRecipe.servings,
      };

      apiResponse<NutritionResponseDTO>(
        res,
        200,
        true,
        "Recipe nutrition analyzed and saved successfully",
        nutritionResponse
      );
    } catch (error) {
      logger.error("Error analyzing recipe nutrition:", error);
      next(error);
    }
  };

  getChatHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const { limit = 50, conversationId } = req.query;

      logger.debug(`RecipeController: Fetching chat history for recipe ${id}, conversationId: ${conversationId}`);

      const history = await this.chatService.getConversationHistory(
        id,
        userId,
        Number(limit),
        conversationId as string
      );

      apiResponse(
        res,
        200,
        true,
        "Chat history fetched successfully",
        history
      );
    } catch (error) {
      logger.error("Error fetching chat history:", error);
      next(error);
    }
  };

  getUserConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      logger.debug(`RecipeController: Fetching unique conversations for user ${userId}`);

      const conversations = await this.chatService.getUserConversations(userId);

      apiResponse(
        res,
        200,
        true,
        "User conversations fetched successfully",
        conversations
      );
    } catch (error) {
      logger.error("Error fetching user conversations:", error);
      next(error);
    }
  };

  getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      logger.debug(`RecipeController: Fetching dashboard stats for user ${userId}`);

      const stats = await this.recipeService.getDashboardStats(userId);

      apiResponse(
        res,
        200,
        true,
        "Dashboard statistics fetched successfully",
        stats
      );
    } catch (error) {
      logger.error("Error fetching dashboard statistics:", error);
      next(error);
    }
  };

  deleteConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const recipeId = req.params.id as string;
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const { conversationId } = req.query;

      logger.debug(`RecipeController: Deleting conversation for recipe ${recipeId}, conversationId: ${conversationId}`);

      const success = await this.chatService.deleteConversation(
        recipeId,
        userId,
        conversationId as string
      );

      apiResponse(
        res,
        200,
        true,
        "Conversation deleted successfully",
        success
      );
    } catch (error) {
      logger.error("Error deleting conversation:", error);
      next(error);
    }
  };

  uploadImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_Id;
      if (!userId) {
        throw new AppError("UNAUTHORIZED", 401);
      }

      const { image, title } = req.body;
      if (!image) {
        throw new AppError("Image data is required", 400);
      }

      if (cloudinaryService.isAvailable()) {
        const uploadResult = await cloudinaryService.uploadRecipeImage(image, title || "user_recipe");
        if (uploadResult) {
          apiResponse(res, 200, true, "Image uploaded to Cloudinary successfully", uploadResult);
          return;
        }
      }

      // If Cloudinary is not configured or failed, return data URL directly
      apiResponse(res, 200, true, "Image accepted", {
        url: image,
        publicId: undefined,
      });
    } catch (error) {
      logger.error("Error uploading recipe image:", error);
      next(error);
    }
  };
}
