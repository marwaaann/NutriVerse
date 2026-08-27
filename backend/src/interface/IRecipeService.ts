import { IRecipe } from "./IRecipe";
import { INutrition } from "./INutritionService";

export interface CreateRecipeInput {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  preparationSteps: string[];
  cookingTime: number;
  servings: number;
  category?: string;
  image?: string;
}

export interface IRecipeService {
  createRecipe(userId: string, recipeData: CreateRecipeInput): Promise<IRecipe>;
  
  getRecipe(id: string): Promise<IRecipe | null>;
  
  updateRecipe(id: string, userId: string, recipeData: Partial<CreateRecipeInput>): Promise<IRecipe | null>;
  
  deleteRecipe(id: string, userId: string): Promise<boolean>;
  
  getUserRecipes(userId: string, limit?: number, offset?: number): Promise<IRecipe[]>;
  
  getAllRecipes(limit?: number, offset?: number): Promise<IRecipe[]>;
  
  analyzeAndCalculateNutrition(recipe: Partial<IRecipe>): Promise<INutrition>;
  
  getRecipeNutrition(id: string): Promise<INutrition | null>;

  analyzeRecipeNutritionAndSave(id: string, userId: string): Promise<IRecipe>;

  getDashboardStats(userId: string): Promise<DashboardStats>;
}

export interface DashboardStats {
  totalRecipes: number;
  totalCalories: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  recentRecipes: IRecipe[];
  chartData: {
    calories: number[];
    protein: number[];
    carbs: number[];
    fat: number[];
    labels: string[];
  };
}
