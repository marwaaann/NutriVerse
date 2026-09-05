export interface IRecipeAgentResponse {
  response: string;
  parsedIntent?: {
    ingredients?: string[];
    maxCalories?: number;
    minProtein?: number;
    mealType?: string;
  };
  toolsCalled: string[];
}

export interface IRecipeAgentService {
  executeAgentQuery(query: string): Promise<IRecipeAgentResponse>;
}
