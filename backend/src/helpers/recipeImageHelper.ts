import { recipeImageService, RecipeImageInput, RecipeImageResult } from "../services/recipe_image_service";

export const getRecipeImage = async (recipe: RecipeImageInput): Promise<string> => {
  const result = await recipeImageService.resolveRecipeImage(recipe);
  return result.url;
};

export { recipeImageService, RecipeImageInput, RecipeImageResult };

