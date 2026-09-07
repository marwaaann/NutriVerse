export interface IAIService {
  normalizeIngredients(
    ingredientsList: string
  ): Promise<Array<{
    name: string;
    quantity: number;
    unit: string;
    isEstimatedQuantity?: boolean;
  }>>;
  
  generateRecipeAnalysis(recipeContext: {
    title: string;
    ingredients: string[];
    nutrition: Record<string, number>;
    servings: number;
  }): Promise<string>;
  
  answerRecipeQuestion(
    question: string,
    recipeContext: Record<string, any>
  ): Promise<string>;
  
  suggestRecipeModification(
    recipeContext: Record<string, any>,
    suggestion: string
  ): Promise<string>;

  generateMealPlan(
    preferencesContext: Record<string, any>,
    availableRecipes: any[],
    dateStr?: string,
    avoidDishes?: string[]
  ): Promise<any>;

  suggestMealSwaps(
    preferencesContext: Record<string, any>,
    mealType: string,
    currentMeal: any
  ): Promise<any>;

  classifyRequest(userPrompt: string): Promise<boolean>;
  
  generateRecipeFromPrompt(
    userPrompt: string,
    preferences: any,
    recipesContext: any
  ): Promise<any>;

  generateIngredientsForDishes(
    dishTitles: string[]
  ): Promise<Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }>>;
}
