import { WebSocket } from "ws";
import { aiService, recipeRepository, nutritionService } from "../container/container";
import { ClientChatMessage, ServerChatMessage } from "./chat.types";
import { UserPreferencesModel } from "../models/userPreferences_model";
import logger from "../config/logger";
import axios from "axios";

const getRecipeImage = async (recipe: { title: string; ingredients: { name: string }[]; cuisine?: string; category?: string }): Promise<string> => {
  const title = recipe.title;
  const t = title.toLowerCase();
  
  // 1. Try querying Unsplash Developer API if a key is configured
  const apiKey = process.env.RECIPE_IMAGE_API_KEY || process.env.UNSPLASH_ACCESS_KEY;
  if (apiKey) {
    try {
      const mainIngredients = recipe.ingredients.slice(0, 2).map(i => i.name).join(" ");
      const query = `${title} ${mainIngredients}`.replace(/[^a-zA-Z0-9\s]/g, "").trim();
      logger.info(`Querying Unsplash API for image with query: "${query}"`);
      
      const response = await axios.get("https://api.unsplash.com/search/photos", {
        params: {
          query: query,
          per_page: 1,
          orientation: "landscape"
        },
        headers: {
          Authorization: `Client-ID ${apiKey}`
        }
      });
      const url = response.data?.results?.[0]?.urls?.regular;
      if (url) {
        logger.info(`Unsplash resolved image: ${url}`);
        return url;
      }
    } catch (err: any) {
      logger.error("Error querying Unsplash API, falling back:", err.message);
    }
  }

  // 2. High-fidelity specific keyword dictionary fallback (Strict 1-to-1 matching)
  if (t.includes("kerala") || t.includes("sadya")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"; // Kerala Sadya South Indian meal
  }
  if (t.includes("chocolate") && (t.includes("nut") || t.includes("almond") || t.includes("hazelnut") || t.includes("bark"))) {
    return "https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=600&q=80"; // Chocolate with nuts
  }
  if (t.includes("chocolate cake")) {
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"; // Chocolate cake
  }
  if (t.includes("chocolate") || t.includes("brownie") || t.includes("mousse")) {
    return "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"; // Chocolate dessert
  }
  if (t.includes("shawarma")) {
    return "https://images.unsplash.com/photo-1642683215891-12c9c94157cc?auto=format&fit=crop&w=600&q=80"; // Shawarma wrap
  }
  if (t.includes("biryani")) {
    return "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80"; // Biryani
  }
  if (t.includes("paneer")) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"; // Paneer Butter Masala
  }
  if (t.includes("ramen")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80"; // Japanese Ramen
  }
  if (t.includes("fish curry") || t.includes("fish")) {
    return "https://images.unsplash.com/photo-1547928576-a4a3323dce9d?auto=format&fit=crop&w=600&q=80"; // Fish curry
  }
  if (t.includes("salad")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"; // Salad
  }
  if (t.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"; // Pizza
  }
  if (t.includes("soup")) {
    return "https://images.unsplash.com/photo-1547592165-e1d17fed6006?auto=format&fit=crop&w=600&q=80"; // Soup
  }
  if (t.includes("burger")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"; // Burger
  }
  if (t.includes("pancake") || t.includes("toast") || t.includes("waffle") || t.includes("oats")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"; // Breakfast
  }
  
  // Generic fallback: a neutral premium food photo
  return "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80"; 
};

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
          genRecipe.image = await getRecipeImage(genRecipe);

          const responseMessage: ServerChatMessage = {
            type: "CHAT_RESPONSE",
            message: genRecipe.conflictResolution || "Here is the recipe I've generated based on your requirements. You can review, edit, or add it to your library below.",
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
