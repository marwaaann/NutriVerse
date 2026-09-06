import { Router } from "express";
import { RecipeController } from "../controllers/recipe_controller";
import { validate } from "../middlewares/validationMiddleware";
import { createRecipeSchema, updateRecipeSchema } from "../validators/recipeValidation";
import { authMiddleware } from "../middlewares/authMiddleware";

export const createRecipeRoutes = (recipeController: RecipeController): Router => {
  const router = Router();

  // Public routes
  router.get("/", recipeController.getAllRecipes);
  router.get("/:id", recipeController.getRecipe);
  router.get("/:id/nutrition", recipeController.getRecipeNutrition);

  // Protected routes (require authentication)
  router.use(authMiddleware); // All routes below this require authentication

  router.post("/", validate(createRecipeSchema), recipeController.createRecipe);
  router.put("/:id", validate(updateRecipeSchema), recipeController.updateRecipe);
  router.delete("/:id", recipeController.deleteRecipe);
  router.post("/upload-image", recipeController.uploadImage);
  router.get("/user/my-recipes", recipeController.getUserRecipes);
  router.get("/user/dashboard-stats", recipeController.getDashboardStats);
  router.post("/:id/analyze-nutrition", recipeController.analyzeRecipeNutrition);

  return router;
};
