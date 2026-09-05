import { IRecipeAgentService, IRecipeAgentResponse } from "../interface/IRecipeAgentService";
import { IRecipeRepository } from "../interface/IRecipeRepository";
import { IFoodDataClient } from "../interface/IFoodDataClient";
import { IAIService } from "../interface/IAIService";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage, AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../config/env";
import logger from "../config/logger";
import { getRecipeImage } from "../helpers/recipeImageHelper";

const RecipeAgentStateAnnotation = Annotation.Root({
  query: Annotation<string>,
  parsedIntent: Annotation<{
    ingredients?: string[];
    maxCalories?: number;
    minProtein?: number;
    mealType?: string;
  } | undefined>({
    reducer: (x, y) => y !== undefined ? y : x,
    default: () => undefined,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  toolsCalled: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  error: Annotation<string | undefined>({
    reducer: (x, y) => y !== undefined ? y : x,
    default: () => undefined,
  }),
});

type AgentStateType = typeof RecipeAgentStateAnnotation.State;

export class RecipeAgentService implements IRecipeAgentService {
  private llm: ChatGoogleGenerativeAI;
  private runnableGraph: any;

  constructor(
    private recipeRepository: IRecipeRepository,
    private foodDataClient: IFoodDataClient,
    private aiService: IAIService
  ) {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: ENV.GEMINI_API_KEY,
      model: ENV.GEMINI_MODEL || "gemini-2.5-flash",
    });

    this.initializeGraph();
  }

  private createTools() {
    const searchDatabaseRecipes = tool(
      async (input) => {
        try {
          logger.info(`Agent Tool [search_database_recipes] called with input: ${JSON.stringify(input)}`);
          // Query all recipes from database
          const allRecipes = await this.recipeRepository.findAll(100, 0);
          
          // Filter matching criteria
          const filtered = allRecipes.filter(recipe => {
            // Filter by max calories
            if (input.maxCalories !== undefined && recipe.caloriesPerServing !== undefined) {
              if (recipe.caloriesPerServing > input.maxCalories) return false;
            }
            
            // Filter by min protein
            if (input.minProtein !== undefined && recipe.proteinPerServing !== undefined) {
              if (recipe.proteinPerServing < input.minProtein) return false;
            }
            
            // Filter by ingredients (if provided, match any)
            if (input.ingredients && input.ingredients.length > 0) {
              const recipeIngs = recipe.ingredients.map(i => i.name.toLowerCase());
              const match = input.ingredients.some(ing => 
                recipeIngs.some(rIng => rIng.includes(ing.toLowerCase()))
              );
              if (!match) return false;
            }
            
            // Filter by mealType / category
            if (input.mealType) {
              const catMatch = recipe.category?.toLowerCase().includes(input.mealType.toLowerCase()) || 
                               recipe.description?.toLowerCase().includes(input.mealType.toLowerCase()) ||
                               recipe.title.toLowerCase().includes(input.mealType.toLowerCase());
              if (!catMatch) return false;
            }
            
            return true;
          });

          if (filtered.length === 0) {
            logger.info(`Agent Tool [search_database_recipes] - NO MATCH. Returning explicit 'no match' signal.`);
            return JSON.stringify({
              status: "NO_MATCH",
              message: "No matching recipes found in local database."
            });
          }

          // Return simplified recipe results
          return JSON.stringify(filtered.map(r => ({
            id: r._id,
            title: r.title,
            description: r.description,
            cookingTime: r.cookingTime,
            servings: r.servings,
            caloriesPerServing: r.caloriesPerServing,
            proteinPerServing: r.proteinPerServing,
            carbohydratesPerServing: r.carbohydratesPerServing,
            fatPerServing: r.fatPerServing,
            ingredients: r.ingredients.map(i => `${i.quantity} ${i.unit} ${i.name}`),
            preparationSteps: r.preparationSteps,
            image: r.image,
          })));
        } catch (error: any) {
          logger.error(`Error in search_database_recipes tool: ${error.message}`);
          return JSON.stringify({
            status: "ERROR",
            message: `Failed to search recipes in database: ${error.message}`
          });
        }
      },
      {
        name: "search_database_recipes",
        description: "Searches the MongoDB database for existing recipes that match user criteria like ingredients, max calories, min protein, or meal type.",
        schema: z.object({
          ingredients: z.array(z.string()).optional().describe("List of target ingredients, e.g., ['chicken']"),
          maxCalories: z.number().optional().describe("Maximum calories limit per serving"),
          minProtein: z.number().optional().describe("Minimum protein grams limit per serving"),
          mealType: z.string().optional().describe("Meal type or category (e.g., dinner, breakfast, lunch, snack)"),
        }),
      }
    );

    const queryUsdaNutrition = tool(
      async (input) => {
        try {
          logger.info(`Agent Tool [query_usda_nutrition] called with input: ${JSON.stringify(input)}`);
          const result = await this.foodDataClient.getNutritionData(input.foodName, input.quantity, input.unit);
          if (!result) {
            return JSON.stringify({
              status: "NO_MATCH",
              message: `No nutritional data found for ingredient: ${input.foodName}`
            });
          }
          return JSON.stringify(result);
        } catch (error: any) {
          logger.error(`Error in query_usda_nutrition tool: ${error.message}`);
          return JSON.stringify({
            status: "ERROR",
            message: `Failed to query USDA nutrition data: ${error.message}`
          });
        }
      },
      {
        name: "query_usda_nutrition",
        description: "Queries nutrition density/data for a single ingredient using USDA FoodData Central or a local dictionary.",
        schema: z.object({
          foodName: z.string().describe("Name of the ingredient, e.g. 'chicken' or 'chickpea'"),
          quantity: z.number().describe("Quantity of the ingredient"),
          unit: z.string().describe("Unit of measurement, e.g. 'g', 'gram', 'cup', 'whole'"),
        }),
      }
    );

    const generateFallbackRecipe = tool(
      async (input) => {
        try {
          logger.info(`Agent Tool [generate_fallback_recipe] called with input: ${JSON.stringify(input)}`);
          // Generate a custom recipe using our AI service (which uses Gemini structured JSON schema)
          const recipe = await this.aiService.generateRecipeFromPrompt(input.prompt, {}, []);
          recipe.image = await getRecipeImage(recipe);
          return JSON.stringify(recipe);
        } catch (error: any) {
          logger.error(`Error in generate_fallback_recipe tool: ${error.message}`);
          return JSON.stringify({
            status: "ERROR",
            message: `Failed to generate recipe fallback: ${error.message}`
          });
        }
      },
      {
        name: "generate_fallback_recipe",
        description: "Generates a completely new recipe matching user constraints using Gemini AI. Call this tool ONLY if search_database_recipes returned NO_MATCH, or if the user explicitly asks for a new or customized recipe that is not in the database.",
        schema: z.object({
          prompt: z.string().describe("Detail prompt for the recipe generation, including target calorie limits, protein requirements, and ingredient constraints."),
        }),
      }
    );

    return [searchDatabaseRecipes, queryUsdaNutrition, generateFallbackRecipe];
  }

  private initializeGraph() {
    const tools = this.createTools();
    const toolsMap = new Map<string, any>(tools.map(t => [t.name as string, t]));
    const llmWithTools = this.llm.bindTools(tools);

    // Nodes implementations
    const parseIntentNode = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
      try {
        logger.info(`[GraphNode: parse_intent] Parsing user query: "${state.query}"`);
        
        const intentParserSchema = z.object({
          ingredients: z.array(z.string()).optional().describe("List of target single-word ingredients, e.g., ['chicken']"),
          maxCalories: z.number().optional().describe("Maximum calories limit per serving"),
          minProtein: z.number().optional().describe("Minimum protein grams limit per serving"),
          mealType: z.string().optional().describe("Meal type or category (e.g. dinner, breakfast, lunch, snack, dessert)"),
        });

        const intentParser = this.llm.withStructuredOutput(intentParserSchema);
        const parsed = await intentParser.invoke([
          new SystemMessage("Extract structured constraints from the user query. If a constraint is not specified in the prompt, set it to undefined."),
          new HumanMessage(state.query)
        ]);

        logger.info(`[GraphNode: parse_intent] Successfully parsed constraints: ${JSON.stringify(parsed)}`);

        // Add SystemMessage to guide the LLM's tool calling phase
        const guideMessage = new SystemMessage(
          `You are NutriVerse's agentic recipe assistant.
Here are the structured constraints parsed from the user's request:
- Ingredients: ${parsed.ingredients ? parsed.ingredients.join(", ") : "None"}
- Max Calories: ${parsed.maxCalories || "None"}
- Min Protein: ${parsed.minProtein || "None"}
- Meal Type: ${parsed.mealType || "None"}

CRITICAL TOOL SELECTION RULES:
1. Always call 'search_database_recipes' first to see if a matching recipe is in the local database.
2. If 'search_database_recipes' returns a JSON containing "status": "NO_MATCH", the LLM MUST immediately call 'generate_fallback_recipe' with a descriptive prompt to generate a new customized recipe matching the constraints. Do not output a message to the user saying no recipes were found; call the generator tool instead.
3. If the user is asking for general nutritional information of an ingredient, call 'query_usda_nutrition'.`
        );

        return {
          parsedIntent: parsed,
          messages: [guideMessage, new HumanMessage(state.query)],
        };
      } catch (err: any) {
        logger.error(`[GraphNode: parse_intent] Error parsing intent: ${err.message}`);
        return {
          error: `Intent Parsing Failed: ${err.message}`
        };
      }
    };

    const queryToolsNode = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
      try {
        logger.info(`[GraphNode: query_tools] Calling LLM with message count: ${state.messages.length}`);
        const response = await llmWithTools.invoke(state.messages);
        return {
          messages: [response],
        };
      } catch (err: any) {
        logger.error(`[GraphNode: query_tools] Error in query_tools: ${err.message}`);
        return {
          error: `LLM Query Tools Failed: ${err.message}`
        };
      }
    };

    const executeToolsNode = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
      try {
        logger.info("[GraphNode: execute_tools] Inspecting tool calls");
        const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
        const toolCalls = lastMessage.tool_calls || [];
        
        const toolMessages: BaseMessage[] = [];
        const toolsCalledList: string[] = [];

        for (const tc of toolCalls) {
          const tName = tc.name;
          const tArgs = tc.args;
          const tId = tc.id!;
          
          logger.info(`[GraphNode: execute_tools] Executing tool: ${tName} with args: ${JSON.stringify(tArgs)}`);
          toolsCalledList.push(tName);

          const toolInstance = toolsMap.get(tName);
          if (!toolInstance) {
            toolMessages.push(new ToolMessage({
              content: `Error: Tool ${tName} not found.`,
              tool_call_id: tId,
              name: tName
            }));
            continue;
          }

          const output = await toolInstance.invoke(tArgs);
          logger.debug(`[GraphNode: execute_tools] Tool ${tName} output: ${output}`);

          toolMessages.push(new ToolMessage({
            content: output,
            tool_call_id: tId,
            name: tName
          }));
        }

        return {
          messages: toolMessages,
          toolsCalled: toolsCalledList,
        };
      } catch (err: any) {
        logger.error(`[GraphNode: execute_tools] Error executing tools: ${err.message}`);
        return {
          error: `Tool Execution Failed: ${err.message}`
        };
      }
    };

    const generateResponseNode = async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
      try {
        logger.info("[GraphNode: generate_response] Compiling final markdown response");
        
        if (state.error) {
          return {
            messages: [new AIMessage(`The recipe assistant encountered an error while processing your request: ${state.error}`)]
          };
        }

        // Synthesize a markdown response by appending formatting prompt as a final HumanMessage
        const response = await this.llm.invoke([
          ...state.messages,
          new HumanMessage(`Synthesize the final response from the above tool output and constraints.
- Format the output beautifully using GitHub Markdown.
- If a recipe was found or generated, display it clearly. Format it with a title, description, macro breakdown per serving (Calories, Protein, Carbs, Fat), prep time/cook time, serving size, list of ingredients, and clear instructions.
- If a USDA query was run, show a summary of the nutritional density.
- Do not output raw JSON, make sure the response is human-readable markdown.`)
        ]);

        return {
          messages: [response]
        };
      } catch (err: any) {
        logger.error(`[GraphNode: generate_response] Error formatting response: ${err.message}`);
        return {
          messages: [new AIMessage(`We generated a response but failed to format it cleanly. Error: ${err.message}`)]
        };
      }
    };

    // Conditional routing logic
    const checkError1 = (state: AgentStateType) => {
      if (state.error) {
        logger.warn(`[GraphEdge: check_error_1] Error detected: ${state.error}. Routing to generate_response.`);
        return "generate_response";
      }
      return "query_tools";
    };

    const decideNextStep = (state: AgentStateType) => {
      if (state.error) {
        logger.warn(`[GraphEdge: decideNextStep] Error detected: ${state.error}. Routing to generate_response.`);
        return "generate_response";
      }
      
      const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
      const toolCalls = lastMessage.tool_calls || [];
      if (toolCalls.length > 0) {
        logger.info(`[GraphEdge: decideNextStep] LLM requested ${toolCalls.length} tool call(s). Routing to execute_tools.`);
        return "execute_tools";
      }
      logger.info("[GraphEdge: decideNextStep] No tool calls. Routing to generate_response.");
      return "generate_response";
    };

    const checkError3 = (state: AgentStateType) => {
      if (state.error) {
        logger.warn(`[GraphEdge: check_error_3] Error detected: ${state.error}. Routing to generate_response.`);
        return "generate_response";
      }
      return "query_tools";
    };

    // Build Graph
    const builder = new StateGraph(RecipeAgentStateAnnotation)
      .addNode("parse_intent", parseIntentNode)
      .addNode("query_tools", queryToolsNode)
      .addNode("execute_tools", executeToolsNode)
      .addNode("generate_response", generateResponseNode);

    builder.addEdge(START, "parse_intent");
    
    builder.addConditionalEdges("parse_intent", checkError1, {
      generate_response: "generate_response",
      query_tools: "query_tools",
    });

    builder.addConditionalEdges("query_tools", decideNextStep, {
      generate_response: "generate_response",
      execute_tools: "execute_tools",
    });

    builder.addConditionalEdges("execute_tools", checkError3, {
      generate_response: "generate_response",
      query_tools: "query_tools",
    });

    builder.addEdge("generate_response", END);

    this.runnableGraph = builder.compile();
  }

  async executeAgentQuery(query: string): Promise<IRecipeAgentResponse> {
    try {
      logger.info(`RecipeAgentService: Starting graph run for query: "${query}"`);
      
      const finalState = await this.runnableGraph.invoke(
        { query },
        { recursionLimit: 12 }
      );

      const lastMessage = finalState.messages[finalState.messages.length - 1] as AIMessage;
      const responseText = lastMessage?.content?.toString() || "No response was generated by the assistant.";

      return {
        response: responseText,
        parsedIntent: finalState.parsedIntent,
        toolsCalled: finalState.toolsCalled || [],
      };
    } catch (error: any) {
      logger.error("RecipeAgentService execution crashed:", error);
      return {
        response: `The recipe agent was unable to process your request. Error: ${error.message}`,
        toolsCalled: [],
      };
    }
  }
}
