import RecipeService from "../src/services/recipe_service";
import NutritionService from "../src/services/nutrition_service";
import { ChatService } from "../src/services/chat_service";
import { IRecipeRepository } from "../src/interface/IRecipeRepository";
import { INutritionService, INutrition } from "../src/interface/INutritionService";
import { IFoodDataClient } from "../src/interface/IFoodDataClient";
import { IAIService } from "../src/interface/IAIService";
import { IChatMessageRepository } from "../src/interface/IChatMessageRepository";
import { IRecipe } from "../src/interface/IRecipe";

describe("NutriVerse Services Tests", () => {
  // --- MOCK DEFINITIONS ---
  let mockRecipeRepository: jest.Mocked<IRecipeRepository>;
  let mockNutritionService: jest.Mocked<INutritionService>;
  let mockFoodDataClient: jest.Mocked<IFoodDataClient>;
  let mockAIService: jest.Mocked<IAIService>;
  let mockChatMessageRepository: jest.Mocked<IChatMessageRepository>;

  beforeEach(() => {
    mockRecipeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByAuthorId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByCategory: jest.fn(),
    };

    mockNutritionService = {
      analyzeRecipeIngredients: jest.fn(),
      fetchIngredientNutrition: jest.fn(),
      calculatePerServing: jest.fn(),
      normalizeIngredient: jest.fn(),
    };

    mockFoodDataClient = {
      searchFood: jest.fn(),
      getNutritionData: jest.fn(),
      getFoodsByCategory: jest.fn(),
      normalizeQuantity: jest.fn(),
    };

    mockAIService = {
      normalizeIngredients: jest.fn(),
      generateRecipeAnalysis: jest.fn(),
      answerRecipeQuestion: jest.fn(),
      suggestRecipeModification: jest.fn(),
    };

    mockChatMessageRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRecipeAndUser: jest.fn(),
      findByRecipe: jest.fn(),
      deleteByRecipeAndUser: jest.fn(),
      deleteAllByRecipe: jest.fn(),
    };
  });

  // --- RECIPE SERVICE TESTS ---
  describe("RecipeService", () => {
    it("should successfully create a recipe and calculate per-serving nutrition", async () => {
      const recipeService = new RecipeService(mockRecipeRepository, mockNutritionService);
      
      const mockNutrition: INutrition = {
        calories: 600,
        protein: 40,
        carbohydrates: 20,
        fat: 15,
      };

      const mockPerServing = {
        calories: 300,
        protein: 20,
        carbohydrates: 10,
        fat: 7.5,
        servingSize: 2,
      };

      mockNutritionService.analyzeRecipeIngredients.mockResolvedValue(mockNutrition);
      mockNutritionService.calculatePerServing.mockResolvedValue(mockPerServing);
      
      const inputRecipe = {
        title: "Test Recipe",
        ingredients: [{ name: "chicken", quantity: 200, unit: "g" }],
        preparationSteps: ["Cook it"],
        cookingTime: 20,
        servings: 2,
      };

      const mockCreatedRecipe: IRecipe = {
        ...inputRecipe,
        _id: "123",
        authorId: "user-1",
        nutrition: mockNutrition,
        caloriesPerServing: 300,
        proteinPerServing: 20,
        carbohydratesPerServing: 10,
        fatPerServing: 7.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecipeRepository.create.mockResolvedValue(mockCreatedRecipe);

      const result = await recipeService.createRecipe("user-1", inputRecipe);

      expect(result).toEqual(mockCreatedRecipe);
      expect(mockNutritionService.analyzeRecipeIngredients).toHaveBeenCalledWith(inputRecipe.ingredients);
      expect(mockRecipeRepository.create).toHaveBeenCalled();
    });
  });

  // --- NUTRITION SERVICE TESTS ---
  describe("NutritionService", () => {
    it("should correctly analyze ingredients and fetch individual nutrients", async () => {
      const nutritionService = new NutritionService(mockFoodDataClient, mockAIService);

      mockAIService.normalizeIngredients.mockResolvedValue([
        { name: "chicken breast", quantity: 200, unit: "g" },
      ]);

      const mockNutritionData: INutrition = {
        calories: 220,
        protein: 30,
        carbohydrates: 0,
        fat: 4,
      };

      mockFoodDataClient.getNutritionData.mockResolvedValue(mockNutritionData);

      const ingredients = [{ name: "chicken", quantity: 200, unit: "g" }];
      const result = await nutritionService.analyzeRecipeIngredients(ingredients);

      expect(result.calories).toBe(220);
      expect(result.protein).toBe(30);
      expect(mockAIService.normalizeIngredients).toHaveBeenCalled();
      expect(mockFoodDataClient.getNutritionData).toHaveBeenCalledWith("chicken breast", 200, "g");
    });
  });

  // --- CHAT SERVICE TESTS ---
  describe("ChatService", () => {
    it("should build context and ask Gemini to generate response", async () => {
      const chatService = new ChatService(mockChatMessageRepository, mockAIService);

      mockAIService.answerRecipeQuestion.mockResolvedValue("This has 200 kcal");

      const result = await chatService.generateAIResponse(
        "How many calories?",
        { title: "Salad" },
        []
      );

      expect(result).toBe("This has 200 kcal");
      expect(mockAIService.answerRecipeQuestion).toHaveBeenCalled();
    });
  });
});
