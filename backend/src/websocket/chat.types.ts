export type ClientMessageType = "CHAT_MESSAGE";
export type ServerMessageType = "CHAT_RESPONSE" | "ERROR";

export interface ClientChatMessage {
  type: ClientMessageType;
  recipeId: string;
  message: string;
  conversationId?: string;
}

export interface ServerChatMessage {
  type: ServerMessageType;
  message: string;
  recipeId?: string;
  timestamp: string;
  conversationId?: string;
  isRecipeGeneration?: boolean;
  generatedRecipe?: any;
}
