import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  HelpCircle, 
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  Users,
  CheckCircle,
  BookOpen
} from "lucide-react";
import { recipeService } from "../services/recipeService";
import { Link } from "react-router-dom";
import { FormattedAiMessage } from "../utils/formatAiMessage";
import { showToast } from "../utils/toast";

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  isRecipeGeneration?: boolean;
  generatedRecipe?: any;
  savedRecipeId?: string;
}

const SUGGESTED_QUESTIONS = [
  "High protein chicken dinner under 600 calories",
  "Authentic Kerala vegetarian lunch",
  "Quick 15-minute breakfast",
  "Vegan chocolate dessert"
];

// Helper to render image skeleton and smooth transition
const RecipeImage: React.FC<{ src: string; title: string }> = ({ src, title }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="h-40 w-full overflow-hidden rounded-xl relative bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs">
      {!loaded && (
        <span className="animate-pulse">Finding recipe image...</span>
      )}
      <img 
        src={src} 
        alt={title} 
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
      />
    </div>
  );
};

export const ChatOverview: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Save loading state & inline errors
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [saveErrorIndex, setSaveErrorIndex] = useState<number | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize WebSocket Connection
  useEffect(() => {
    setStatus("connecting");
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const wsUrl = backendUrl.replace(/^http/, "ws");

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CHAT_RESPONSE") {
          setIsTyping(false);
          setChatError(null);
          
          setMessages((prev) => [
            ...prev,
            { 
              role: "assistant", 
              message: data.message,
              isRecipeGeneration: data.isRecipeGeneration,
              generatedRecipe: data.generatedRecipe
            },
          ]);
        } else if (data.type === "ERROR") {
          setIsTyping(false);
          setChatError(data.message);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, chatError]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !socketRef.current || status !== "connected") return;

    setChatError(null);
    const payload = {
      type: "CHAT_MESSAGE",
      recipeId: "general",
      message: text
    };
    socketRef.current.send(JSON.stringify(payload));

    setMessages((prev) => [...prev, { role: "user", message: text }]);
    setInputMessage("");
    setIsTyping(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(inputMessage);
    }
  };

  // Save to Database Handler
  const handleSaveRecipe = async (index: number) => {
    const recipeData = messages[index].generatedRecipe;
    if (!recipeData || savingIndex !== null) return;

    try {
      setSavingIndex(index);
      setSaveErrorIndex(null);
      setSaveErrorMessage(null);
      
      const totalCookingTime = Math.max(
        1,
        Math.round(Number((recipeData.prepTime || 0) + (recipeData.cookTime || 0)) || 30)
      );

      const payload = {
        title: recipeData.title,
        description: recipeData.description || "",
        ingredients: recipeData.ingredients.map((ing: any) => ({
          name: ing.name,
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || "g"
        })),
        preparationSteps: recipeData.instructions,
        cookingTime: totalCookingTime,
        servings: Number(recipeData.servings) || 2,
        category: recipeData.category || "Dinner",
        image: recipeData.image || "",
        imagePublicId: recipeData.imagePublicId || undefined
      };

      const newRecipe = await recipeService.createRecipe(payload);
      
      setMessages((prev) => {
        const next = [...prev];
        next[index].savedRecipeId = newRecipe._id;
        return next;
      });
      showToast.success("Recipe added to your collection!");
    } catch (err: any) {
      console.error("Failed to save generated recipe:", err);
      setSaveErrorIndex(index);
      const errMsg =
        err.response?.status === 401 ||
        err.response?.data?.message === "NOT_AUTHENTICATED" ||
        err.response?.data?.message === "UNAUTHORIZED"
          ? "Your session has expired. Please log in again."
          : err.response?.data?.message || err.message || "Failed to save recipe. Please try again.";
      setSaveErrorMessage(errMsg);
      showToast.error(errMsg);
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Main Chat Panel */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
        
        {/* Header bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2 rounded-xl">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-md font-black text-zinc-900 dark:text-white">NutriVerse AI Assistant</h1>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Tell me what you want to eat, and I'll create it.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-100 dark:border-zinc-700">
            <span className={`h-2 w-2 rounded-full ${
              status === "connected" ? "bg-green-500 animate-pulse" : status === "connecting" ? "bg-amber-500 animate-bounce" : "bg-red-500"
            }`} />
            <span className="text-[10px] text-zinc-500 font-bold capitalize">{status}</span>
          </div>
        </div>

        {/* Message scrolling area */}
        <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/20 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4 py-8">
              <span className="text-4xl">🤖</span>
              <h3 className="font-extrabold text-zinc-800 dark:text-white">What would you like me to cook?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Describe the recipe you want, your dietary requirements, or list ingredients available at home, and I will generate a complete structured recipe card for you!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="space-y-3">
                <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-amber-500 text-white rounded-tr-none"
                      : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-tl-none"
                  }`}>
                    {msg.role === "assistant" ? (
                      <FormattedAiMessage content={msg.message} />
                    ) : (
                      msg.message
                    )}
                  </div>
                </div>

                {/* Recipe Preview Card Rendering */}
                {msg.role === "assistant" && msg.isRecipeGeneration && msg.generatedRecipe && (
                  <div className="w-[90%] md:w-[80%] mr-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden p-6 space-y-4 ml-6">
                    <div className="text-left space-y-4">
                        
                        {/* Recipe Image with Custom Skeleton Loading and Transition */}
                        {msg.generatedRecipe.image && (
                          <RecipeImage src={msg.generatedRecipe.image} title={msg.generatedRecipe.title} />
                        )}

                        <div className="space-y-1.5">
                          <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <BookOpen className="h-5 w-5 text-amber-500 shrink-0" />
                            {msg.generatedRecipe.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {msg.generatedRecipe.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                            {msg.generatedRecipe.category}
                          </span>
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {msg.generatedRecipe.prepTime + msg.generatedRecipe.cookTime} mins
                          </span>
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <Users className="h-3 w-3" /> {msg.generatedRecipe.servings} servings
                          </span>
                        </div>

                        {/* Nutrition Information */}
                        {msg.generatedRecipe.nutrition && (
                          <div className="grid grid-cols-5 gap-1.5 py-2 border-y border-zinc-200 dark:border-zinc-800 text-center text-xs bg-zinc-50/40 dark:bg-zinc-800/20 rounded-xl">
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">{msg.generatedRecipe.nutrition.caloriesPerServing || msg.generatedRecipe.nutrition.calories}</div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Calories</div>
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">{msg.generatedRecipe.nutrition.proteinPerServing || msg.generatedRecipe.nutrition.protein}g</div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Protein</div>
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">{msg.generatedRecipe.nutrition.carbohydratesPerServing || msg.generatedRecipe.nutrition.carbs}g</div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Carbs</div>
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">{msg.generatedRecipe.nutrition.fatPerServing || msg.generatedRecipe.nutrition.fat}g</div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Fat</div>
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">{(msg.generatedRecipe.nutrition.fiber !== undefined ? msg.generatedRecipe.nutrition.fiber : 0)}g</div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Fiber</div>
                            </div>
                          </div>
                        )}

                        {/* Ingredients */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Ingredients</h4>
                          <ul className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                            {msg.generatedRecipe.ingredients.map((ing: any, i: number) => (
                              <li key={i} className="flex justify-between border-b border-zinc-100/50 dark:border-zinc-800 pb-1">
                                <span>✓ {ing.name}</span>
                                <span className="font-semibold">{ing.quantity} {ing.unit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Instructions</h4>
                          <ol className="text-xs space-y-2 text-zinc-700 dark:text-zinc-300 list-decimal pl-4">
                            {msg.generatedRecipe.instructions.map((step: string, i: number) => (
                              <li key={i} className="pl-1">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Tips */}
                        {msg.generatedRecipe.tips && msg.generatedRecipe.tips.length > 0 && (
                          <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500">Chef Tips</h4>
                            <ul className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                              {msg.generatedRecipe.tips.map((tip: string, i: number) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tags */}
                        {msg.generatedRecipe.dietaryTags && msg.generatedRecipe.dietaryTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {msg.generatedRecipe.dietaryTags.map((tag: string, i: number) => (
                              <span key={i} className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Save Error Inline Display */}
                        {saveErrorIndex === index && saveErrorMessage && (
                          <div className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40 w-full">
                            Unable to save this recipe because: {saveErrorMessage}
                          </div>
                        )}

                        {/* Actions Panel */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 justify-end">
                          <button
                            onClick={() => {
                              const lastUserMsg = [...messages].slice(0, index).reverse().find(m => m.role === "user")?.message;
                              if (lastUserMsg) handleSendMessage(lastUserMsg);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                          </button>

                          {msg.savedRecipeId ? (
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-extrabold text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> Added to My Recipes
                              </span>
                              <Link
                                to={`/recipes/${msg.savedRecipeId}`}
                                className="px-3.5 py-1.5 bg-zinc-900 text-white hover:bg-black font-bold rounded-xl text-xs transition cursor-pointer"
                              >
                                View Recipe
                              </Link>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSaveRecipe(index)}
                              disabled={savingIndex === index}
                              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                            >
                              {savingIndex === index ? (
                                <>Saving...</>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" /> Add to My Recipes
                                </>
                              )}
                            </button>
                          )}
                        </div>

                      </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Graceful Inline Error State */}
          {chatError && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Sorry, I couldn't process that request.
                </div>
                <button
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.message;
                    if (lastUserMsg) handleSendMessage(lastUserMsg);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex gap-2.5 max-w-[80%] mr-auto items-center text-zinc-400 py-1">
              <Bot className="h-4 w-4 animate-bounce text-amber-500" />
              <span className="text-xs font-bold">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 shrink-0">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> Suggested Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-xs bg-zinc-100 hover:bg-amber-50 hover:text-amber-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-3.5 py-2 rounded-xl transition cursor-pointer font-semibold border border-zinc-200 dark:border-zinc-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Input Panel */}
        <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 shrink-0 flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={status !== "connected"}
            placeholder={status === "connected" ? "What would you like me to cook?" : "Establishing WebSocket connection..."}
            className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-xl outline-none focus:border-amber-500 text-zinc-900 dark:text-white text-sm"
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={status !== "connected" || !inputMessage.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold p-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
