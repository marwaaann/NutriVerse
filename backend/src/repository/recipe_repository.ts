import { RecipeModel, IRecipeDocument } from "../models/recipe_model";
import { IRecipeRepository } from "../interface/IRecipeRepository";
import { IRecipe } from "../interface/IRecipe";
import { AppError } from "../utils/AppError";

class RecipeRepository implements IRecipeRepository {
  async create(recipeData: Partial<IRecipe>): Promise<IRecipe> {
    try {
      const recipe = new RecipeModel(recipeData);
      const savedRecipe = await recipe.save();
      return this.mapToRecipe(savedRecipe);
    } catch (error) {
      throw new AppError("Failed to create recipe", 500);
    }
  }

  async findById(id: string): Promise<IRecipe | null> {
    try {
      const recipe = await RecipeModel.findById(id).lean();
      return recipe ? this.mapToRecipe(recipe as IRecipeDocument) : null;
    } catch (error) {
      throw new AppError("Failed to fetch recipe", 500);
    }
  }

  async findByAuthorId(authorId: string, limit: number = 10, offset: number = 0): Promise<IRecipe[]> {
    try {
      const recipes = await RecipeModel.find({ authorId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      return recipes.map(recipe => this.mapToRecipe(recipe as IRecipeDocument));
    } catch (error) {
      throw new AppError("Failed to fetch user recipes", 500);
    }
  }

  async update(id: string, recipeData: Partial<IRecipe>): Promise<IRecipe | null> {
    try {
      const recipe = await RecipeModel.findByIdAndUpdate(
        id,
        recipeData,
        { new: true }
      ).lean();
      return recipe ? this.mapToRecipe(recipe as IRecipeDocument) : null;
    } catch (error) {
      throw new AppError("Failed to update recipe", 500);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await RecipeModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw new AppError("Failed to delete recipe", 500);
    }
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<IRecipe[]> {
    try {
      const recipes = await RecipeModel.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      return recipes.map(recipe => this.mapToRecipe(recipe as IRecipeDocument));
    } catch (error) {
      throw new AppError("Failed to fetch recipes", 500);
    }
  }

  async findByCategory(category: string, limit: number = 20, offset: number = 0): Promise<IRecipe[]> {
    try {
      const recipes = await RecipeModel.find({ category })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      return recipes.map(recipe => this.mapToRecipe(recipe as IRecipeDocument));
    } catch (error) {
      throw new AppError("Failed to fetch recipes by category", 500);
    }
  }

  private mapToRecipe(doc: IRecipeDocument | any): IRecipe {
    return {
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      ingredients: doc.ingredients,
      preparationSteps: doc.preparationSteps,
      cookingTime: doc.cookingTime,
      servings: doc.servings,
      category: doc.category,
      image: doc.image,
      authorId: doc.authorId,
      nutrition: doc.nutrition,
      caloriesPerServing: doc.caloriesPerServing,
      proteinPerServing: doc.proteinPerServing,
      carbohydratesPerServing: doc.carbohydratesPerServing,
      fatPerServing: doc.fatPerServing,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export default RecipeRepository;
