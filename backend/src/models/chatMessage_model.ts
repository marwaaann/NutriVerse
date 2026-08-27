import mongoose, { Schema, Document } from "mongoose";

interface IChatMessageDocument extends Document {
  userId: string;
  recipeId: string;
  role: "user" | "assistant";
  message: string;
  timestamp: Date;
  conversationId: string;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    recipeId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
      default: "default",
    },
  },
  {
    timestamps: false,
  }
);

// Create indexes for fast querying of specific conversations
chatMessageSchema.index({ userId: 1, conversationId: 1, timestamp: 1 });
chatMessageSchema.index({ recipeId: 1, userId: 1, timestamp: -1 });

export const ChatMessageModel = mongoose.model<IChatMessageDocument>(
  "ChatMessage",
  chatMessageSchema
);

export { IChatMessageDocument };
