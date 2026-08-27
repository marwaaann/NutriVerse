import { INutrition } from "./INutritionService";

export interface IFoodItem {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: number;
  servingUnit: string;
}

export interface IFoodDataClient {
  searchFood(foodName: string): Promise<IFoodItem[]>;
  
  getNutritionData(
    foodName: string,
    quantity: number,
    unit: string
  ): Promise<INutrition | null>;
  
  getFoodsByCategory(category: string): Promise<IFoodItem[]>;
  
  normalizeQuantity(quantity: number, fromUnit: string, toUnit: string): Promise<number>;
}
