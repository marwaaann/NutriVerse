import { IFoodDataClient, IFoodItem } from "../interface/IFoodDataClient";
import { INutrition } from "../interface/INutritionService";
import { ENV } from "../config/env";
import logger from "../config/logger";

const unitToGrams: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  mg: 0.001,
  milligram: 0.001,
  milligrams: 0.001,
  lb: 453.59,
  pound: 453.59,
  pounds: 453.59,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  cup: 240,
  cups: 240,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  pinch: 0.36,
  pinches: 0.36,
  piece: 100,
  pieces: 100,
  unit: 100,
  units: 100,
  whole: 100,
  clove: 5,
  cloves: 5,
  head: 150,
  heads: 150,
  stalk: 40,
  stalks: 40,
  can: 400,
  cans: 400,
  slice: 30,
  slices: 30,
};

const LOCAL_FOOD_DICTIONARY: Record<string, Omit<INutrition, "fiber" | "sugar" | "sodium"> & { fiber?: number, sugar?: number, sodium?: number }> = {
  "chickpea": { calories: 164, protein: 9, carbohydrates: 27, fat: 2.6, fiber: 7.6, sugar: 4.8, sodium: 24 },
  "cucumber": { calories: 15, protein: 0.6, carbohydrates: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2 },
  "tomato": { calories: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 },
  "onion": { calories: 40, protein: 1.1, carbohydrates: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4 },
  "feta": { calories: 264, protein: 14, carbohydrates: 4.1, fat: 21, fiber: 0, sugar: 4.1, sodium: 1116 },
  "olive": { calories: 115, protein: 0.8, carbohydrates: 6.3, fat: 10.7, fiber: 3.2, sugar: 0, sodium: 735 },
  "olive oil": { calories: 884, protein: 0, carbohydrates: 0, fat: 100, fiber: 0, sugar: 0, sodium: 2 },
  "lemon juice": { calories: 22, protein: 0.4, carbohydrates: 6.9, fat: 0.2, fiber: 0.3, sugar: 2.5, sodium: 1 },
  "oregano": { calories: 265, protein: 9, carbohydrates: 69, fat: 4.3, fiber: 42.5, sugar: 4.1, sodium: 25 },
  "black pepper": { calories: 251, protein: 10, carbohydrates: 64, fat: 3.3, fiber: 25.3, sugar: 0.6, sodium: 20 },
  "salt": { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 38758 },
  "chicken": { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
  "pasta": { calories: 131, protein: 5, carbohydrates: 25, fat: 1.1, fiber: 1.8, sugar: 0.8, sodium: 6 },
  "butter": { calories: 717, protein: 0.9, carbohydrates: 0.1, fat: 81, fiber: 0, sugar: 0.1, sodium: 643 },
  "heavy cream": { calories: 340, protein: 2.8, carbohydrates: 2.7, fat: 36, fiber: 0, sugar: 2.7, sodium: 34 },
  "cream": { calories: 340, protein: 2.8, carbohydrates: 2.7, fat: 36, fiber: 0, sugar: 2.7, sodium: 34 },
  "parmesan": { calories: 431, protein: 38, carbohydrates: 4.1, fat: 29, fiber: 0, sugar: 0.8, sodium: 1529 },
  "honey": { calories: 304, protein: 0.3, carbohydrates: 82, fat: 0, fiber: 0, sugar: 82, sodium: 4 },
  "garlic": { calories: 149, protein: 6.4, carbohydrates: 33, fat: 0.5, fiber: 2.1, sugar: 1, sodium: 17 }
};

export class FoodDataClient implements IFoodDataClient {
  private apiKey: string;

  constructor() {
    this.apiKey = ENV.FOOD_DATA_API_KEY || "DEMO_KEY";
  }

  findLocalNutrition(foodName: string): INutrition | null {
    const nameLower = foodName.toLowerCase().trim();
    for (const key of Object.keys(LOCAL_FOOD_DICTIONARY)) {
      if (nameLower.includes(key)) {
        const item = LOCAL_FOOD_DICTIONARY[key];
        return {
          calories: item.calories,
          protein: item.protein,
          carbohydrates: item.carbohydrates,
          fat: item.fat,
          fiber: item.fiber || 0,
          sugar: item.sugar || 0,
          sodium: item.sodium || 0
        };
      }
    }
    return null;
  }

  async searchFood(foodName: string): Promise<IFoodItem[]> {
    try {
      logger.debug(`FoodDataClient: Searching for food "${foodName}"`);
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
        foodName
      )}&api_key=${this.apiKey}&pageSize=5`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API search error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.foods || data.foods.length === 0) {
        return [];
      }

      return data.foods.map((food: any) => {
        const nutrients = food.foodNutrients || [];
        const getNutrientVal = (id: number) => {
          const nut = nutrients.find((n: any) => n.nutrientId === id || Number(n.nutrientNumber) === id);
          return nut ? nut.value : 0;
        };

        return {
          foodName: food.description,
          calories: getNutrientVal(208),
          protein: getNutrientVal(203),
          carbohydrates: getNutrientVal(205),
          fat: getNutrientVal(204),
          fiber: getNutrientVal(291),
          sugar: getNutrientVal(269),
          sodium: getNutrientVal(307),
          servingSize: 100,
          servingUnit: "g",
        };
      });
    } catch (error) {
      logger.error(`FoodDataClient searchFood error for "${foodName}":`, error);
      return [];
    }
  }

  async getNutritionData(
    foodName: string,
    quantity: number,
    unit: string
  ): Promise<INutrition | null> {
    try {
      logger.debug(`FoodDataClient: Fetching nutrition data for ${quantity} ${unit} of "${foodName}"`);
      
      const quantityInGrams = await this.normalizeQuantity(quantity, unit, "g");
      const factor = quantityInGrams / 100;

      // 1. Try local lookup first to bypass USDA rate-limits
      const localMatch = this.findLocalNutrition(foodName);
      if (localMatch) {
        logger.info(`FoodDataClient: Local dictionary match for "${foodName}"`);
        return {
          calories: localMatch.calories * factor,
          protein: localMatch.protein * factor,
          carbohydrates: localMatch.carbohydrates * factor,
          fat: localMatch.fat * factor,
          fiber: (localMatch.fiber ?? 0) * factor,
          sugar: (localMatch.sugar ?? 0) * factor,
          sodium: (localMatch.sodium ?? 0) * factor,
        };
      }

      // 2. Query USDA
      const results = await this.searchFood(foodName);
      if (results.length === 0) {
        // Fallback: estimate generic nutritional density if API search fails
        logger.warn(`FoodDataClient: No search results found for "${foodName}". Returning generic fallback.`);
        return {
          calories: 100 * factor,
          protein: 5 * factor,
          carbohydrates: 15 * factor,
          fat: 3 * factor,
          fiber: 1 * factor,
          sugar: 1 * factor,
          sodium: 100 * factor,
        };
      }

      // Pick the first result (most relevant)
      const foodItem = results[0];

      return {
        calories: foodItem.calories * factor,
        protein: foodItem.protein * factor,
        carbohydrates: foodItem.carbohydrates * factor,
        fat: foodItem.fat * factor,
        fiber: foodItem.fiber ? foodItem.fiber * factor : 0,
        sugar: foodItem.sugar ? foodItem.sugar * factor : 0,
        sodium: foodItem.sodium ? foodItem.sodium * factor : 0,
      };
    } catch (error) {
      logger.error(`FoodDataClient getNutritionData error for "${foodName}":`, error);
      return null;
    }
  }

  async getFoodsByCategory(category: string): Promise<IFoodItem[]> {
    return this.searchFood(category);
  }

  async normalizeQuantity(quantity: number, fromUnit: string, toUnit: string): Promise<number> {
    const fromUnitLower = fromUnit.toLowerCase().trim();
    const toUnitLower = toUnit.toLowerCase().trim();

    if (fromUnitLower === toUnitLower) {
      return quantity;
    }

    if (toUnitLower === "g") {
      const conversion = unitToGrams[fromUnitLower];
      if (conversion !== undefined) {
        return quantity * conversion;
      }
      if (fromUnitLower.endsWith("s")) {
        const singular = fromUnitLower.slice(0, -1);
        const singConversion = unitToGrams[singular];
        if (singConversion !== undefined) {
          return quantity * singConversion;
        }
      }
      return quantity * 100;
    }

    return quantity;
  }
}
