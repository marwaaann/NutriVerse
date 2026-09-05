import { AuthService } from "../services/auth_service";
import { AuthController } from "../controllers/auth_controller";
import UserRepository from "../repository/user_repository";
import { RedisHelper } from "../helpers/redisHelper";

import RecipeRepository from "../repository/recipe_repository";
import { FoodDataClient } from "../services/food_data_client";
import NutritionService from "../services/nutrition_service";
import RecipeService from "../services/recipe_service";
import { RecipeController } from "../controllers/recipe_controller";

import ChatMessageRepository from "../repository/chatMessage_repository";
import { GeminiAIService } from "../services/gemini_ai_service";
import { ChatService } from "../services/chat_service";

import { NotificationRepository } from "../repository/notification_repository";
import { NotificationService } from "../services/notification_service";
import { NotificationController } from "../controllers/notification_controller";

import { RecipeAgentService } from "../services/recipe_agent_service";
import { AgentController } from "../controllers/agent_controller";

const redisHelper = new RedisHelper();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository, redisHelper);
const authController = new AuthController(authService);

const recipeRepository = new RecipeRepository();
const foodDataClient = new FoodDataClient();

const chatMessageRepository = new ChatMessageRepository();
const aiService = new GeminiAIService();
const chatService = new ChatService(chatMessageRepository, aiService);

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

const nutritionService = new NutritionService(foodDataClient, aiService);
const recipeService = new RecipeService(recipeRepository, nutritionService, notificationService);
const recipeController = new RecipeController(recipeService, chatService);

const recipeAgentService = new RecipeAgentService(recipeRepository, foodDataClient, aiService);
const agentController = new AgentController(recipeAgentService);

export {
  authController,
  recipeController,
  recipeService,
  chatService,
  aiService,
  chatMessageRepository,
  recipeRepository,
  notificationService,
  notificationController,
  nutritionService,
  recipeAgentService,
  agentController,
};