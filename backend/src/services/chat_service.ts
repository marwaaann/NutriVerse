import { IChatService, IChatMessage } from "../interface/IChatService";
import { IChatMessageRepository } from "../interface/IChatMessageRepository";
import { IAIService } from "../interface/IAIService";

export class ChatService implements IChatService {
  constructor(
    private chatMessageRepository: IChatMessageRepository,
    private aiService: IAIService
  ) {}

  async saveChatMessage(message: IChatMessage): Promise<IChatMessage> {
    return this.chatMessageRepository.create(message);
  }

  async getConversationHistory(
    recipeId: string,
    userId: string,
    limit?: number,
    conversationId?: string
  ): Promise<IChatMessage[]> {
    return this.chatMessageRepository.findByRecipeAndUser(recipeId, userId, limit, 0, conversationId);
  }

  async generateAIResponse(
    userMessage: string,
    recipeContext: Record<string, any>,
    conversationHistory: IChatMessage[]
  ): Promise<string> {
    // Format conversation history for context awareness
    const historyText = conversationHistory
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`)
      .join("\n");

    const contextWithHistory = {
      ...recipeContext,
      conversationHistory: historyText,
    };

    return this.aiService.answerRecipeQuestion(userMessage, contextWithHistory);
  }

  async deleteConversation(recipeId: string, userId: string, conversationId?: string): Promise<boolean> {
    return this.chatMessageRepository.deleteByRecipeAndUser(recipeId, userId, conversationId);
  }

  async getUserConversations(userId: string): Promise<any[]> {
    return this.chatMessageRepository.findUniqueConversations(userId);
  }
}
