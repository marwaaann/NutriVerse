import { INutrition } from "./INutritionService";

export interface IIngredient {
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
}

export interface IRecipe {
  _id: string;
  title: string;
  description?: string;
  ingredients: IIngredient[];
  preparationSteps: string[];
  cookingTime: number; // in minutes
  servings: number;
  category?: string;
  image?: string;
  authorId: string;
  nutrition?: INutrition;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbohydratesPerServing?: number;
  fatPerServing?: number;
  createdAt: Date;
  updatedAt: Date;
}
