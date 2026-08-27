export interface IChatMessage {
  userId: string;
  recipeId: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  conversationId?: string;
}

export interface IChatService {
  saveChatMessage(message: IChatMessage): Promise<IChatMessage>;
  
  getConversationHistory(
    recipeId: string,
    userId: string,
    limit?: number,
    conversationId?: string
  ): Promise<IChatMessage[]>;
  
  generateAIResponse(
    userMessage: string,
    recipeContext: Record<string, any>,
    conversationHistory: IChatMessage[]
  ): Promise<string>;
  
  deleteConversation(recipeId: string, userId: string, conversationId?: string): Promise<boolean>;

  getUserConversations(userId: string): Promise<any[]>;
}
