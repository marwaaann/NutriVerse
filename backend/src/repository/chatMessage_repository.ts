import { ChatMessageModel, IChatMessageDocument } from "../models/chatMessage_model";
import { IChatMessageRepository } from "../interface/IChatMessageRepository";
import { IChatMessage } from "../interface/IChatService";
import { AppError } from "../utils/AppError";

class ChatMessageRepository implements IChatMessageRepository {
  async create(message: IChatMessage): Promise<IChatMessage> {
    try {
      const chatMessage = new ChatMessageModel(message);
      const savedMessage = await chatMessage.save();
      return this.mapToChatMessage(savedMessage);
    } catch (error) {
      throw new AppError("Failed to save chat message", 500);
    }
  }

  async findById(id: string): Promise<IChatMessage | null> {
    try {
      const message = await ChatMessageModel.findById(id).lean();
      return message ? this.mapToChatMessage(message as IChatMessageDocument) : null;
    } catch (error) {
      throw new AppError("Failed to fetch chat message", 500);
    }
  }

  async findByRecipeAndUser(
    recipeId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
    conversationId?: string
  ): Promise<IChatMessage[]> {
    try {
      const query: Record<string, any> = { recipeId, userId };
      if (conversationId) {
        query.conversationId = conversationId;
      }
      
      const messages = await ChatMessageModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      
      // Return sorted chronologically for the chat flow
      return messages.map(msg => this.mapToChatMessage(msg as IChatMessageDocument)).reverse();
    } catch (error) {
      throw new AppError("Failed to fetch conversation history", 500);
    }
  }

  async findByRecipe(
    recipeId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<IChatMessage[]> {
    try {
      const messages = await ChatMessageModel.find({ recipeId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      return messages.map(msg => this.mapToChatMessage(msg as IChatMessageDocument));
    } catch (error) {
      throw new AppError("Failed to fetch recipe messages", 500);
    }
  }

  async deleteByRecipeAndUser(recipeId: string, userId: string, conversationId?: string): Promise<boolean> {
    try {
      const query: Record<string, any> = { recipeId, userId };
      if (conversationId) {
        query.conversationId = conversationId;
      }
      const result = await ChatMessageModel.deleteMany(query);
      return result.deletedCount > 0;
    } catch (error) {
      throw new AppError("Failed to delete conversation", 500);
    }
  }

  async deleteAllByRecipe(recipeId: string): Promise<boolean> {
    try {
      const result = await ChatMessageModel.deleteMany({ recipeId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new AppError("Failed to delete recipe messages", 500);
    }
  }

  async findUniqueConversations(userId: string): Promise<any[]> {
    try {
      return await ChatMessageModel.aggregate([
        { $match: { userId } },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$conversationId",
            recipeId: { $first: "$recipeId" },
            lastMessage: { $first: "$message" },
            timestamp: { $first: "$timestamp" },
          }
        },
        { $sort: { timestamp: -1 } }
      ]);
    } catch (error) {
      throw new AppError("Failed to fetch unique conversations", 500);
    }
  }

  private mapToChatMessage(doc: IChatMessageDocument | any): IChatMessage {
    return {
      userId: doc.userId,
      recipeId: doc.recipeId,
      role: doc.role,
      message: doc.message,
      timestamp: doc.timestamp,
      conversationId: doc.conversationId,
    };
  }
}

export default ChatMessageRepository;
