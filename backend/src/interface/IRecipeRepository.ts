import { IRecipe } from "./IRecipe";

export interface IRecipeRepository {
  create(recipeData: Partial<IRecipe>): Promise<IRecipe>;
  findById(id: string): Promise<IRecipe | null>;
  findByAuthorId(authorId: string, limit?: number, offset?: number): Promise<IRecipe[]>;
  update(id: string, recipeData: Partial<IRecipe>): Promise<IRecipe | null>;
  delete(id: string): Promise<boolean>;
  findAll(limit?: number, offset?: number): Promise<IRecipe[]>;
  findByCategory(category: string, limit?: number, offset?: number): Promise<IRecipe[]>;
}
