import mongoose, { Document, Schema } from "mongoose";

export interface INotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedRecipeId?: string;
  relatedMealPlanId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedRecipeId: {
      type: String,
    },
    relatedMealPlanId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationModel = mongoose.model<INotificationDocument>(
  "Notification",
  notificationSchema
);
