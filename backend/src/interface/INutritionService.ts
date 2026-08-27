export interface INutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface INutritionPerServing extends INutrition {
  servingSize: number;
}

export interface INutritionService {
  analyzeRecipeIngredients(
    ingredients: Array<{ name: string; quantity: number; unit: string }>
  ): Promise<INutrition>;
  
  fetchIngredientNutrition(
    ingredientName: string,
    quantity: number,
    unit: string
  ): Promise<INutrition | null>;
  
  calculatePerServing(totalNutrition: INutrition, servings: number): Promise<INutritionPerServing>;
  
  normalizeIngredient(ingredientName: string): Promise<{
    normalizedName: string;
    quantity?: number;
    unit?: string;
  }>;
}
