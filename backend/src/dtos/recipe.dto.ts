export interface CreateRecipeDTO {
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

export interface UpdateRecipeDTO {
  title?: string;
  description?: string;
  ingredients?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  preparationSteps?: string[];
  cookingTime?: number;
  servings?: number;
  category?: string;
  image?: string;
}

export interface RecipeResponseDTO {
  _id: string;
  title: string;
  description?: string;
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
  }>;
  preparationSteps: string[];
  cookingTime: number;
  servings: number;
  category?: string;
  image?: string;
  authorId: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    caloriesPerServing?: number;
    proteinPerServing?: number;
    carbohydratesPerServing?: number;
    fatPerServing?: number;
  };
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbohydratesPerServing?: number;
  fatPerServing?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionResponseDTO {
  recipeId: string;
  totalNutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  perServing: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  servings: number;
}
