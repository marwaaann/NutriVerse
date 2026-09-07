import { WebSocket } from "ws";
import { aiService, recipeRepository, nutritionService } from "../container/container";
import { ClientChatMessage, ServerChatMessage } from "./chat.types";
import { UserPreferencesModel } from "../models/userPreferences_model";
import logger from "../config/logger";
import axios from "axios";
import { recipeImageService } from "../services/recipe_image_service";

export class ChatHandler {
  async handleMessage(
    ws: WebSocket,
    userId: string,
    rawMessage: string
  ): Promise<void> {
    try {
      logger.info("[CHAT] Message received");
      const parsed: ClientChatMessage = JSON.parse(rawMessage);
      
      if (parsed.type !== "CHAT_MESSAGE") {
        this.sendError(ws, "Invalid message type");
        return;
      }

      const { recipeId: parsedRecipeId, message } = parsed;
      const recipeId = parsedRecipeId || "general";

      logger.info(`[CHAT] recipeId = ${recipeId}`);
      logger.info(`[CHAT] chat message text: ${message}`);

      if (!message) {
        this.sendError(ws, "message is required", recipeId);
        return;
      }

      // Check user preferences
      const preferences = await UserPreferencesModel.findOne({ userId });
      let prefContext = {};
      if (preferences) {
        prefContext = {
          diet: preferences.diet,
          allergies: preferences.allergies,
          dietaryRestrictions: preferences.dietaryRestrictions,
          healthGoals: preferences.healthGoals,
        };
      }

      logger.info("[CHAT] Loading recipe context");
      let recipeContext: Record<string, any> = {};

      if (recipeId === "general") {
        const recipes = await recipeRepository.findByAuthorId(userId, 50, 0);
        recipeContext = {
          notes: "The user is in general chat context. Here is a summary of all the user's recipes in their library:",
          recipes: recipes.map(r => ({
            title: r.title,
            description: r.description,
            cookingTime: r.cookingTime,
            servings: r.servings,
            category: r.category,
            nutrition: r.nutrition || {}
          }))
        };
      } else {
        const recipe = await recipeRepository.findById(recipeId);
        if (!recipe) {
          this.sendError(ws, "Recipe not found", recipeId);
          return;
        }

        recipeContext = {
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients.map(
            (ing) => `${ing.quantity} ${ing.unit} ${ing.name}`
          ),
          preparationSteps: recipe.preparationSteps,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          nutrition: recipe.nutrition || {},
        };
      }

      // 1. Classify request type
      logger.info("[CHAT] Classifying request type...");
      const isRecipeReq = await aiService.classifyRequest(message);
      logger.info(`[CHAT] Classified user request: "${message}" -> ${isRecipeReq ? "RECIPE_GENERATION" : "QUESTION"}`);

      if (isRecipeReq) {
        logger.info("[CHAT] Generating recipe with Gemini");
        try {
          const genRecipe = await aiService.generateRecipeFromPrompt(message, prefContext, recipeContext);
          logger.info("[CHAT] Gemini recipe generated successfully");
          logger.info("[CHAT] Validating generated recipe");
          
          logger.info("[CHAT] Calculating nutrition");
          const calculatedNutrition = await nutritionService.analyzeRecipeIngredients(genRecipe.ingredients);
          const calculatedPerServing = await nutritionService.calculatePerServing(calculatedNutrition, genRecipe.servings);
          
          genRecipe.nutrition = {
            calories: calculatedNutrition.calories,
            protein: calculatedNutrition.protein,
            carbohydrates: calculatedNutrition.carbohydrates,
            fat: calculatedNutrition.fat,
            fiber: calculatedNutrition.fiber || 0,
            sugar: calculatedNutrition.sugar || 0,
            sodium: calculatedNutrition.sodium || 0,
            caloriesPerServing: calculatedPerServing.calories,
            proteinPerServing: calculatedPerServing.protein,
            carbohydratesPerServing: calculatedPerServing.carbohydrates,
            fatPerServing: calculatedPerServing.fat,
          };

          logger.info(`[CHAT] Resolving image for recipe title: "${genRecipe.title}"`);
          const imageResult = await recipeImageService.resolveRecipeImage(genRecipe);
          genRecipe.image = imageResult.url;
          genRecipe.imagePublicId = imageResult.publicId;

          let responseTextMessage = genRecipe.conflictResolution || "Here is the recipe I've generated based on your requirements. You can review, edit, or add it to your library below.";
          const ingList = genRecipe.ingredients?.map((i: any) => `- ${i.quantity} ${i.unit} ${i.name}`).join("\n");
          const stepList = genRecipe.preparationSteps?.map((s: any, idx: number) => `${idx + 1}. ${s}`).join("\n");
          const recipeSummary = `\n\n### ${genRecipe.title}\n${genRecipe.description || ""}\n\n**⏱ Prep/Cook Time:** ${genRecipe.cookingTime} mins | **Servings:** ${genRecipe.servings}\n\n**Ingredients:**\n${ingList}\n\n**Instructions:**\n${stepList}`;
          responseTextMessage += recipeSummary;

          const responseMessage: ServerChatMessage = {
            type: "CHAT_RESPONSE",
            message: responseTextMessage,
            recipeId,
            timestamp: new Date().toISOString(),
            isRecipeGeneration: true,
            generatedRecipe: genRecipe
          };

          logger.info("[CHAT] Sending generated recipe to frontend");
          ws.send(JSON.stringify(responseMessage));
          return;
        } catch (geminiErr: any) {
          logger.error(`[CHAT ERROR] Recipe generation failed: ${geminiErr.message}`);
        }
      }

      // 2. Normal Conversation Q&A Flow
      const connectionHistory = (ws as any).chatHistory || [];
      const historyText = connectionHistory
        .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`)
        .join("\n");

      const contextWithUserDetail = {
        ...recipeContext,
        conversationHistory: historyText,
        userPreferences: prefContext,
        assistantGuidance: "You are the NutriVerse AI Assistant owned by Marwan Shafi. If the user asks general recipe/nutrition questions, answer using their recipe library data provided or standard healthy diet guidelines. Keep your responses friendly, concise, and professional."
      };

      logger.info("[CHAT] Calling Gemini");
      
      let aiResponseText = "";
      try {
        aiResponseText = await aiService.answerRecipeQuestion(message, contextWithUserDetail);
        
        if (aiResponseText.includes("temporarily unavailable")) {
          logger.error("[CHAT ERROR] Gemini request failed: service temporarily unavailable");
        } else {
          logger.info("[CHAT] Gemini responded");
        }
      } catch (geminiErr: any) {
        logger.error(`[CHAT ERROR] Gemini request failed\nmessage = ${geminiErr.message}`);
        aiResponseText = "AI service is temporarily unavailable. Please try again later.";
      }

      // Update in-memory history
      connectionHistory.push({ role: "user", message });
      connectionHistory.push({ role: "assistant", message: aiResponseText });
      if (connectionHistory.length > 20) {
        connectionHistory.splice(0, 2);
      }
      (ws as any).chatHistory = connectionHistory;

      logger.info("[CHAT] Sending response to frontend");
      const responseMessage: ServerChatMessage = {
        type: "CHAT_RESPONSE",
        message: aiResponseText,
        recipeId,
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(responseMessage));
    } catch (error: any) {
      logger.error(`[CHAT ERROR] Message processing failed: ${error.message}`);
      this.sendError(ws, "An error occurred while processing your message");
    }
  }

  sendError(ws: WebSocket, errorMsg: string, recipeId?: string): void {
    const errorResponse: ServerChatMessage = {
      type: "ERROR",
      message: errorMsg,
      recipeId,
      timestamp: new Date().toISOString(),
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
}
export default ChatHandler;
