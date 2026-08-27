import { IChatMessage } from "./IChatService";

export interface IChatMessageRepository {
  create(message: IChatMessage): Promise<IChatMessage>;
  
  findById(id: string): Promise<IChatMessage | null>;
  
  findByRecipeAndUser(
    recipeId: string,
    userId: string,
    limit?: number,
    offset?: number,
    conversationId?: string
  ): Promise<IChatMessage[]>;
  
  findByRecipe(
    recipeId: string,
    limit?: number,
    offset?: number
  ): Promise<IChatMessage[]>;
  
  deleteByRecipeAndUser(recipeId: string, userId: string, conversationId?: string): Promise<boolean>;
  
  deleteAllByRecipe(recipeId: string): Promise<boolean>;

  findUniqueConversations(userId: string): Promise<any[]>;
}
