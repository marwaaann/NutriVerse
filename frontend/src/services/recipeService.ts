import axiosInstance from "../api/axiosInstance";

export interface IngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  ingredients: IngredientInput[];
  preparationSteps: string[];
  cookingTime: number;
  servings: number;
  category: string;
  image?: string;
}

export interface RecipeIngredient extends IngredientInput {
  normalizedName?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface RecipeResponse {
  _id: string;
  title: string;
  description?: string;
  ingredients: RecipeIngredient[];
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
  };
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbohydratesPerServing?: number;
  fatPerServing?: number;
  createdAt: string;
  updatedAt: string;
}

export const recipeService = {
  async getAllRecipes(): Promise<RecipeResponse[]> {
    const response = await axiosInstance.get("/api/recipes");
    return response.data.data;
  },

  async getRecipe(id: string): Promise<RecipeResponse> {
    const response = await axiosInstance.get(`/api/recipes/${id}`);
    return response.data.data;
  },

  async createRecipe(data: CreateRecipeInput): Promise<RecipeResponse> {
    const response = await axiosInstance.post("/api/recipes", data);
    return response.data.data;
  },

  async updateRecipe(id: string, data: Partial<CreateRecipeInput>): Promise<RecipeResponse> {
    const response = await axiosInstance.put(`/api/recipes/${id}`, data);
    return response.data.data;
  },

  async deleteRecipe(id: string): Promise<void> {
    await axiosInstance.delete(`/api/recipes/${id}`);
  },

  async analyzeNutrition(id: string): Promise<RecipeResponse["nutrition"]> {
    const response = await axiosInstance.post(`/api/recipes/${id}/analyze-nutrition`);
    return response.data.data;
  },



  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await axiosInstance.get("/api/recipes/user/dashboard-stats");
    return response.data.data;
  },
};

export interface DashboardStatsResponse {
  totalRecipes: number;
  totalCalories: number;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  recentRecipes: RecipeResponse[];
  chartData: {
    calories: number[];
    protein: number[];
    carbs: number[];
    fat: number[];
    labels: string[];
  };
}
